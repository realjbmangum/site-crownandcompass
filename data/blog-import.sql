-- Load the public essays into blog_posts.
--
-- Not included, and left on their current URLs until Brian decides:
--   chasing-dopamine (names his wife), wife-feel-loved (private marriage detail and workplace).
--
-- Same two-step as the jbmangum Substack import: born as a draft, then
-- published with published_by = 'brian', plus a version row and an activity
-- row for each step. Run once, after migrations/0001_blog.sql.
--
-- Production (only after approval):
--   npx wrangler d1 execute crownandcompass --remote --file=data/blog-import.sql
-- Preview database is crownandcompass-preview, not crownandcompass.
--
-- Each statement is safe to re-run. D1 rejects SQL BEGIN/COMMIT, so this
-- file does not wrap a transaction. A second run inserts nothing new.


-- projects-priorities
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'projects-priorities', 'My projects are killing my priorities', 'When your work and projects quietly take over your real priorities: faith, family, friendship. A Christian man''s honest reckoning with a full, busy life.', '<p>Met with my friend Neil yesterday. He said something that hit hard: "All your projects are just getting in the way of your 100 days book."</p>
        <p>He''s right.</p>
        <p>I got my FCC radio license. Started building a homelab. Launched a Headbangers Ball project. Reading trading books. All good things. All distractions.</p>
        <p>Meanwhile, the book I''m supposed to write sits untouched.</p>
        <p>Most men struggle with this. You start 10 things and finish none. Every new project feels productive. But productivity without priority is just busy work.</p>
        <p class="lead-b">The Truth</p>
        <p>You need friends who will call you out. Neil didn''t shame me. He just named the pattern I couldn''t see.</p>
        <p class="lead-b">The Challenge</p>
        <p>What''s your "100 days book"? That one thing you know you should be doing but keep avoiding?</p>
        <p>Then commit to 30 minutes on it today. Not tomorrow. Today.</p>
        <p>Brotherhood means challenging each other to finish what matters.</p>
        <p class="signoff">Brian</p>', '2025-11-22', 'blog/2025/11/projects-priorities/01.jpg', 'My projects are killing my priorities', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'projects-priorities');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'projects-priorities'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"projects-priorities","source":"static:projects-priorities"}', 1 FROM blog_posts p WHERE slug = 'projects-priorities'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('calling', 'Calling')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'projects-priorities' AND t.slug = 'calling';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2025-11-22 12:00:00',
         current_rev = 2, updated_at = '2025-11-22 12:00:00'
     WHERE slug = 'projects-priorities' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'projects-priorities'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"projects-priorities","source":"static:projects-priorities"}', 1 FROM blog_posts p WHERE slug = 'projects-priorities'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');

-- fifteen-percent-no-friends
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'fifteen-percent-no-friends', 'Fifteen percent of men have no close friends', 'Fifteen percent of men have no close friends. Why male loneliness is rising, and a challenge for Christian men to trade digital connection for real brotherhood.', '<p>New research from 2025 shows that 15% of men report having zero close friends. That number was 12% in 1990.</p>
        <p>You read that right. One in seven men has nobody.</p>
        <p>Nobody to call at 2am. Nobody to confess to. Nobody who knows the real struggle. Nobody checking in on Friday.</p>
        <p>And here''s the brutal part: you might be one of them and not even realize it. Because you have work buddies. Gym acquaintances. Fantasy football group chats. But none of those guys know what you''re actually fighting.</p>
        <p>The research also shows that 25% of young men are lonely compared to 17% of all other adults. Young men are losing the friendship battle before they even understand what''s at stake.</p>
        <p class="lead-b">The Real Problem</p>
        <p>Experts point to "digital disconnection" through social media, gaming, and porn. All give you a short-term dopamine hit that replaces real intimacy. You feel connected online while becoming isolated in real life.</p>
        <p class="lead-b">The Truth</p>
        <p>In my newsletter about the disciplines of a godly man, I quoted the research: accountability is "perhaps the leading indicator of spiritual success in a man''s life." But you can''t have accountability without friendship. And you can''t have friendship without vulnerability.</p>
        <p>Half of young men today have three friends or fewer. Fifteen percent have none.</p>
        <div class="scripture">Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up. But pity anyone who falls and has no one to help them up.<span class="ref">Ecclesiastes 4:9-10</span></div>
        <p class="lead-b">The Challenge</p>
        <p>Think of three men in your life. Do any of them know what you''re actually struggling with right now?</p>
        <p>If the answer is no, text one of them today. Not "hey what''s up." Text them your real struggle. The thing you''re ashamed of. The fear you''re carrying. The temptation you''re losing to.</p>
        <p>Brotherhood starts with one vulnerable text.</p>
        <p class="signoff">Brian</p>', '2025-11-24', 'blog/2025/11/fifteen-percent-no-friends/01.jpg', 'Fifteen percent of men have no close friends', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'fifteen-percent-no-friends');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'fifteen-percent-no-friends'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"fifteen-percent-no-friends","source":"static:fifteen-percent-no-friends"}', 1 FROM blog_posts p WHERE slug = 'fifteen-percent-no-friends'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('brotherhood', 'Brotherhood')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'fifteen-percent-no-friends' AND t.slug = 'brotherhood';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2025-11-24 12:00:00',
         current_rev = 2, updated_at = '2025-11-24 12:00:00'
     WHERE slug = 'fifteen-percent-no-friends' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'fifteen-percent-no-friends'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"fifteen-percent-no-friends","source":"static:fifteen-percent-no-friends"}', 1 FROM blog_posts p WHERE slug = 'fifteen-percent-no-friends'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');

-- prioritize-your-mind
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'prioritize-your-mind', 'You say you prioritize your mind', 'You say you prioritize your mind, but your habits say otherwise. An honest challenge for Christian men on what you actually feed your attention each day.', '<p><a href="https://globalwellnessinstitute.org/global-wellness-institute-blog/2025/03/24/mens-wellness-initiative-trends-for-2025/" target="_blank" rel="noopener">95% of men say they prioritize mental health.</a></p>
        <p>I sat with that number for a while. At first, it felt encouraging. Almost hopeful.</p>
        <p>Then I started asking questions.</p>
        <p>If 95% of men prioritize their mental health, why does the <a href="https://globalwellnessinstitute.org/global-wellness-institute-blog/2025/03/24/mens-wellness-initiative-trends-for-2025/" target="_blank" rel="noopener">$90 billion self-care industry</a> keep growing? Why are we buying more journals, downloading more meditation apps, joining more gyms... and still feeling hollowed out?</p>
        <p>I wonder if we''ve confused consumption with care. If we''ve mistaken purchasing for practicing.</p>
        <p>I''ve done this. I bought the journal and let it gather dust. Downloaded the Bible app and forgot the password. Signed up for the gym and found a hundred excuses.</p>
        <p>Here''s what I''m learning: Mental health isn''t something you buy. It''s something you tend, quietly, in the ordinary moments. When no one is watching. When there''s no app to track it.</p>
        <p>It looks like ten minutes of honest journaling before the house wakes up. A phone call to a friend where you actually say what''s going on. A prayer walk with no agenda except to listen.</p>
        <p>I''m curious. Where''s the gap between what you say you prioritize and what you actually practice? I''m still closing that gap myself.</p>
        <p>What''s one small thing you''ve been meaning to do for your inner life but keep putting off?</p>
        <p class="signoff">Brian</p>', '2025-11-24', 'blog/2025/11/prioritize-your-mind/01.jpg', 'You say you prioritize your mind', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'prioritize-your-mind');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'prioritize-your-mind'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"prioritize-your-mind","source":"static:prioritize-your-mind"}', 1 FROM blog_posts p WHERE slug = 'prioritize-your-mind'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('being', 'Being')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'prioritize-your-mind' AND t.slug = 'being';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2025-11-24 12:00:00',
         current_rev = 2, updated_at = '2025-11-24 12:00:00'
     WHERE slug = 'prioritize-your-mind' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'prioritize-your-mind'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"prioritize-your-mind","source":"static:prioritize-your-mind"}', 1 FROM blog_posts p WHERE slug = 'prioritize-your-mind'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');

-- falling-in-love-again
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'falling-in-love-again', 'Falling in love again', 'How to fall in love with your wife again by staying curious about who she is becoming. A Christian husband''s honest reflection on marriage and paying attention.', '<p>Something shifted in me this week.</p>
        <p>I looked at my wife and realized I am falling in love again with who she is becoming. Not who she was when we met. Who she is now. The woman she has grown into through all the hard seasons.</p>
        <p>I think we forget to do this. We marry someone and then stop paying attention to their evolution. We relate to the person we remember instead of the person standing in front of us.</p>
        <p><a href="https://www.gottman.com/blog/10-ways-rekindle-passion-marriage/" target="_blank" rel="noopener">Research from the Gottman Institute</a> shows that the strongest marriages are built on continued curiosity. Couples who stay connected keep asking questions. They notice the changes. They fall in love with the new version, not just the memory.</p>
        <p>I have been guilty of autopilot. Going through the motions. Present in the house but absent to her.</p>
        <p>This week I am paying attention again. Asking questions. Noticing who she is becoming.</p>
        <p>When was the last time you looked at your spouse with fresh eyes? What might you discover if you got curious again?</p>
        <p class="signoff">Brian</p>', '2025-12-06', 'blog/2025/12/falling-in-love-again/01.jpg', 'Falling in love again', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'falling-in-love-again');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'falling-in-love-again'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"falling-in-love-again","source":"static:falling-in-love-again"}', 1 FROM blog_posts p WHERE slug = 'falling-in-love-again'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('marriage', 'Marriage')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'falling-in-love-again' AND t.slug = 'marriage';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2025-12-06 12:00:00',
         current_rev = 2, updated_at = '2025-12-06 12:00:00'
     WHERE slug = 'falling-in-love-again' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'falling-in-love-again'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"falling-in-love-again","source":"static:falling-in-love-again"}', 1 FROM blog_posts p WHERE slug = 'falling-in-love-again'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');

-- question-cut-through
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'question-cut-through', 'The question that cut through', 'The one accountability question that cuts through the small talk in a men''s group, and how a single honest question can open real conversation among Christian men.', '<p>I was on a men''s group call this week when something happened that stuck with me.</p>
        <p>One brother asked another a direct question about his workout commitment. No lecture. No shame. Just a question that cut through the excuses. The kind of question that makes you sit up straighter.</p>
        <p>I watched the other man pause. Really pause. And then he answered honestly.</p>
        <p>That moment reminded me why we need each other. <a href="https://www.npr.org/2025/11/17/nx-s1-5609309/5-fitness-and-mental-health-tips-for-men" target="_blank" rel="noopener">Research shows</a> that accountability partners make us less likely to skip workouts and more likely to stay consistent. But it goes deeper than fitness. Having someone who will ask the hard question might be the difference between drifting and growing.</p>
        <p>I want to be the kind of man who asks those questions. Direct. Loving. The kind that helps a brother see himself more clearly.</p>
        <p>Who in your life asks you the hard questions? And when was the last time you asked one?</p>
        <p class="signoff">Brian</p>', '2025-12-06', 'blog/2025/12/question-cut-through/01.jpg', 'The question that cut through', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'question-cut-through');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'question-cut-through'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"question-cut-through","source":"static:question-cut-through"}', 1 FROM blog_posts p WHERE slug = 'question-cut-through'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('brotherhood', 'Brotherhood')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'question-cut-through' AND t.slug = 'brotherhood';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2025-12-06 12:00:00',
         current_rev = 2, updated_at = '2025-12-06 12:00:00'
     WHERE slug = 'question-cut-through' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'question-cut-through'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"question-cut-through","source":"static:question-cut-through"}', 1 FROM blog_posts p WHERE slug = 'question-cut-through'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');

-- the-long-walk
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'the-long-walk', 'The long walk', 'Christian growth is a long walk, not a quick fix. A reflection for men on why real discipleship takes years of steady steps, and why that''s actually good news.', '<p>I have been reading Luke this week, tracing Jesus''s footsteps on a map. Capernaum to Jerusalem. Galilee to Judea. Mile after mile through dust and heat.</p>

        <p><strong>Jesus was a hiker.</strong></p>

        <p>That thought stopped me. The Son of God walked everywhere. One foot in front of the other, through villages and wilderness, teaching as he went. Every mile, earned.</p>

        <p>I wonder if we''ve lost something in our rush to arrive.</p>

        <p>A new study shows that 45 percent of adult men experience chronic loneliness. Fifteen percent have no close friends at all. We carry phones in our pockets and emptiness in our chests. We''ve optimized for speed and efficiency, but the slow walk with a friend? That''s become rare.</p>

        <p>This week I felt scattered. Work piling up. Things slipping through cracks. I prayed for clarity, and what I got instead was a picture of a ship that needed tightening. Not a new ship. The same ship, with loose bolts. The hull is sound. The sails are up. But the rigging needs attention before the next storm.</p>

        <p>Then I read about the centurion in Luke 7. A Roman soldier asks Jesus to heal his servant, and he grasps something most of us miss. He understood authority. He knew that Jesus''s word alone carried the power. Just the word. That was enough.</p>

        <div class="pullquote">That''s faith that walks.</div>

        <p>The centurion understood something about where power comes from. And that got me thinking about where we come from.</p>

        <p>I also read that when Jesus was born, his family sacrificed two doves. They were too poor for a lamb. The King of Kings came from poverty. It made me think about origins, how the circumstances we come from shape the men we become. My mother left when I was young. I still remember the quiet of the house after she was gone, the way I learned to fill silence with motion. That absence became part of my wiring, part of why I push hard, part of why I sometimes dare people to judge me just so I can prove I can stand alone. We all carry something from where we started. Jesus carried poverty. I carry absence. What do you carry?</p>

        <p>But here''s what''s giving me hope.</p>

        <p>On a men''s group call this week, I watched one brother challenge another about his workout commitment. Direct. Loving. A question that cut through the excuses. It reminded me why we need each other. Why walking alone is a slow death.</p>

        <div class="scripture">
          Two are better than one, because they have a good return for their labor. If either of them falls down, one can help the other up.
          <span class="ref">Ecclesiastes 4:9-10</span>
        </div>

        <p>We need men who will walk alongside us. Men who will say the hard thing. Men who will stay on the long road even when we want to quit.</p>

        <p>And when temptation comes, I''m learning to do what Jesus did in the wilderness. He answered every test with Scripture. "Man does not live by bread alone." "You shall worship the Lord and serve Him only." "You shall not put the Lord your God to the test." He quoted truth and kept walking. Simple. Direct. Rooted.</p>

        <p>Maybe that''s the invitation this week. What loose bolt on your ship needs attention before the next storm? What verse might anchor you when temptation comes? Who will you walk with?</p>

        <p>Jesus covered a lot of ground on foot. He took his time. Present to every village, every person, every dusty mile.</p>

        <p>What would change if we walked that way?</p>

        <p class="signoff">Brian</p>', '2025-12-06', 'blog/2025/12/the-long-walk/01.jpg', 'a narrow trail through dry hills at golden hour, one figure walking', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'the-long-walk');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'the-long-walk'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"the-long-walk","source":"static:the-long-walk"}', 1 FROM blog_posts p WHERE slug = 'the-long-walk'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('faith', 'Faith')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'the-long-walk' AND t.slug = 'faith';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2025-12-06 12:00:00',
         current_rev = 2, updated_at = '2025-12-06 12:00:00'
     WHERE slug = 'the-long-walk' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'the-long-walk'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"the-long-walk","source":"static:the-long-walk"}', 1 FROM blog_posts p WHERE slug = 'the-long-walk'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');

-- verse-in-your-pocket
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'verse-in-your-pocket', 'The verse in your pocket', 'How to keep a single Bible verse with you all day and let it shape your thinking. A simple discipline for Christian men who want Scripture close at hand.', '<p>I''ve been reading through Luke and landed on the temptation of Jesus in the wilderness.</p>
        <p>What struck me was how he fought. Every time Satan came at him, Jesus responded with Scripture. "Man does not live by bread alone." "You shall worship the Lord and serve Him only." "You shall not put the Lord your God to the test."</p>
        <p>He quoted truth and kept walking. Simple. Direct. Rooted.</p>
        <p>I started wondering what would happen if I had a verse ready for the temptation that keeps finding me. Not a whole chapter. Just one verse, memorized, <a href="https://groundworkonline.com/blog/the-spiritual-discipline-of-memorizing-scripture" target="_blank" rel="noopener">hidden in my heart like Psalm 119 says</a>.</p>
        <p>The ancient practice of Scripture memorization is making a quiet comeback. Men are realizing that having God''s Word in your mind changes what you reach for when the pressure hits.</p>
        <p>I am trying this. One verse for the temptation I keep facing. A small dagger for close combat, as Paul called it.</p>
        <p>What verse might anchor you when temptation comes? What truth do you need in your pocket?</p>
        <p class="signoff">Brian</p>', '2025-12-06', 'blog/2025/12/verse-in-your-pocket/01.jpg', 'The verse in your pocket', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'verse-in-your-pocket');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'verse-in-your-pocket'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"verse-in-your-pocket","source":"static:verse-in-your-pocket"}', 1 FROM blog_posts p WHERE slug = 'verse-in-your-pocket'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('faith', 'Faith')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'verse-in-your-pocket' AND t.slug = 'faith';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2025-12-06 12:00:00',
         current_rev = 2, updated_at = '2025-12-06 12:00:00'
     WHERE slug = 'verse-in-your-pocket' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'verse-in-your-pocket'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"verse-in-your-pocket","source":"static:verse-in-your-pocket"}', 1 FROM blog_posts p WHERE slug = 'verse-in-your-pocket'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');

-- so-does-sedation
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'so-does-sedation', 'So does sedation', 'Loneliness tracks poverty. So does the reaching for whatever feels good tonight. On men who drift, and why pressure never brings them back.', '<p>There is an article going around that says the loneliness problem is not really a men''s problem. Nick Keppler wrote it for Slate last month. His argument is that loneliness tracks poverty more closely than it tracks masculinity. Low-wage work with no steady coworkers. No money for the things men gather around. He calls it something society imposes on people rather than something men do to themselves.</p>
        <p>I think he is right. And I think there is a second thing riding alongside it that the article never names.</p>
        <p class="pull">Loneliness tracks poverty. So does sedation.</p>
        <p>When a man is broke and alone, the easiest thing in the world is to reach for whatever feels good right now. It does not have to be good for him. It only has to <strong>work tonight</strong>. A drink. A screen. A bet. An hour that disappears and takes the ache with it. The cheapest comfort is always the one closest to hand, and a man with no money and no company has a short reach.</p>
        <p>That is what makes it so hard to see from the outside. A man who is sedating looks like he is managing. He is not calling anybody at two in the morning. The numbing is doing its job, and that is exactly the problem. <strong>It works well enough that he never has to say a word out loud.</strong></p>
        <p>Peter had a word for the opposite of this, and he put it first:</p>
        <blockquote class="scripture">Be sober-minded; be watchful. Your adversary the devil prowls around like a roaring lion, seeking someone to devour.<cite>1 Peter 5:8</cite></blockquote>
        <p>Read what comes right after it. <em>Resist him, firm in your faith, knowing that the same kinds of suffering are being experienced by your brotherhood throughout the world.</em> Sober-minded, then watchful, then <strong>brotherhood</strong> — in that order. Peter does not tell a man to white-knuckle it alone. He tells him to stay awake, and then he points at the other men.</p>
        <p>A lion hunts the one that has wandered off from the herd. He does not pick the strongest. He picks the one standing by himself.</p>
        <h3>Men drift</h3>
        <p>We see the shape of this in our own group. There is a small nucleus that meets every week, the same men in the same room. Around them is a larger group that jumps in from time to time and then goes quiet for a stretch.</p>
        <p>Men drift. That is not a failure of the men, and it is not a failure of the room. It is just what happens.</p>
        <p>So we meet them where they are and we do not pressure them.</p>
        <p>That sounds like doing nothing. It is a decision, and it cost us something to make it. <strong>A man has to want to change himself first.</strong> You can want it for him, but you cannot want it harder than he does and have it count for anything. Pressure gets you a man who shows up out of guilt, and a man who shows up out of guilt stays about a month.</p>
        <p>What you can do is keep the room open. Keep the seat there. Keep asking without leaning on him. And when he is ready, he already knows exactly where to walk.</p>
        <p>Some weeks the room is full. Some weeks it is the nucleus. Both are Wednesday.</p>
        <h3>The Challenge</h3>
        <p>Think of the man who has gone quiet on you. Not the one in crisis. <strong>The one who is managing.</strong></p>
        <p>Text him today. No invitation, no ask, nothing he has to answer. Just tell him you thought about him. Leave the door where he can find it.</p>
        <p>If you have been the one who drifted, hear this plainly: the door has not moved.</p>
        <p class="signoff">Brian</p>', '2026-09-04', 'blog/2026/09/so-does-sedation/01.jpg', 'So does sedation', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'so-does-sedation');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'so-does-sedation'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"so-does-sedation","source":"static:so-does-sedation"}', 1 FROM blog_posts p WHERE slug = 'so-does-sedation'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('brotherhood', 'Brotherhood')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'so-does-sedation' AND t.slug = 'brotherhood';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2026-09-04 12:00:00',
         current_rev = 2, updated_at = '2026-09-04 12:00:00'
     WHERE slug = 'so-does-sedation' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'so-does-sedation'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"so-does-sedation","source":"static:so-does-sedation"}', 1 FROM blog_posts p WHERE slug = 'so-does-sedation'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');

-- travel-schedule-idol
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'travel-schedule-idol', 'An idol with a travel schedule', 'Eight thousand dollars a year for an eleven year old. An idol is whatever you organize your life around and sacrifice to, and the best ones are built out of good things.', '<p>I read a piece this week about youth travel sports. The number in it was eight thousand dollars a year, for an eleven year old.</p>
        <p>Eight thousand dollars. For a kid who has not finished sixth grade.</p>
        <p>I agreed with all of it. Then I sat with the part underneath it, which is harder to say out loud.</p>
        <p class="pull">We are making idols of our kids.</p>
        <p>That word gets thrown around, so let me be plain about what I mean by it. <strong>An idol is not a statue. An idol is whatever you organize your life around and sacrifice to.</strong> Look at what a family gives up for a travel schedule, and then tell me what else to call it. The weekends go. Sunday mornings go. Dinner at a table with everybody at it goes. The savings go. The marriage gets whatever is left over, and by then there is not much left over.</p>
        <p>Nobody sets out to do this. No father signs an eight thousand dollar check thinking he is bowing down to something. He thinks he is loving his kid, and he is. That is exactly what makes it so hard to see. <strong>The best idols are always built out of good things.</strong></p>
        <p>Jesus said it in one line, and he said it about money on purpose:</p>
        <blockquote class="scripture">For where your treasure is, there your heart will be also.<cite>Matthew 6:21</cite></blockquote>
        <p>Notice the order. He does not say your heart drags your treasure along behind it. He says it runs the other way — <strong>put the treasure somewhere and the heart follows it there.</strong> Which means a man can find out what he actually worships by opening his bank statement, whatever he believes about himself on a Sunday.</p>
        <h3>Whose dream is on the field</h3>
        <p><strong>If your son walked in tomorrow and told you he was done, would you feel relief for him, or would you grieve something of your own?</strong></p>
        <p>Sit with whichever one comes first. That answer tells you who the season actually belongs to.</p>
        <p>Keep your kid on the team if the team is good for him. Some of them are. A boy learning to lose in front of other people, to be coached, to keep a commitment when his body hurts, is a boy being formed. That is worth money and worth Saturdays.</p>
        <p>Just know what you are buying, and know what you are spending. Both are larger than the check.</p>
        <h3>The Challenge</h3>
        <p>Add up what your family spent last year on one child and one sport. Fees, hotels, gas, tournaments, the meals out on the road.</p>
        <p><strong>Then add up the Sundays.</strong></p>
        <p>Put both numbers in front of your wife and ask her what she sees. She has been keeping that ledger already, whether or not anybody asked her for it.</p>
        <p>If you already know you would rather not run that math, you have your answer.</p>
        <p class="signoff">Brian</p>', '2026-09-04', 'blog/2026/09/travel-schedule-idol/01.jpg', 'An idol with a travel schedule', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'travel-schedule-idol');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'travel-schedule-idol'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"travel-schedule-idol","source":"static:travel-schedule-idol"}', 1 FROM blog_posts p WHERE slug = 'travel-schedule-idol'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('fatherhood', 'Fatherhood')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'travel-schedule-idol' AND t.slug = 'fatherhood';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2026-09-04 12:00:00',
         current_rev = 2, updated_at = '2026-09-04 12:00:00'
     WHERE slug = 'travel-schedule-idol' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'travel-schedule-idol'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"travel-schedule-idol","source":"static:travel-schedule-idol"}', 1 FROM blog_posts p WHERE slug = 'travel-schedule-idol'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');

-- fight-club-with-books
INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT 'fight-club-with-books', 'Fight Club with books', 'Crown and Compass is Fight Club with books — a brotherhood of men who read together, tell the truth, and refuse to walk alone.', '<p>I tell people Crown &amp; Compass is a book club for men.</p>
        <p>Then I tell them the real version: Fight Club with books.</p>
        <p>That line gets a laugh sometimes. Fine. Keep it. We are not here to look clever. We are here because every man I know is already in a fight, whether he names it or not.</p>
        <p>Marriage that got quiet and never got loud again in the right way. Money that sits on his chest at 2am. Anger he can hide at work and cannot hide at home. Drift — the slow kind, where the calendar is full and the soul is empty, and nobody around him has asked a real question in months.</p>
        <p>You can look fine on Sunday. Handshake. Coffee. A verse you half-remember. By Wednesday the armor is off and the quiet war is back in the room with you. The one you do not post about. The one your work buddies will never hear because the chat is for memes and logistics and the next fantasy league trash talk.</p>
        <p>And under that fight, most of us are hunting for deeper meaning. Not a TED talk. Not a new productivity stack. Something heavier than the next meeting and the next scroll. A reason to stay pointed when the week tries to spin you.</p>
        <p>So we read. Together.</p>
        <p>Not because a book is magic. A book on a nightstand never saved anybody by itself. We read because a shared text gives men something harder than small talk to push against. Without it, we default to weather, work, and the score. With it, there is a page on the table and nowhere to hide for a minute.</p>
        <p>One book. Six weeks.</p>
        <p>That cadence is the discipline. Kickoff sets the bearing. You dig in. Notes go in the thread. Midway through, life comes onto the table — not the polished version. You push through the middle when the novelty dies and the pages get honest. You finish. Then you <a href="/how-it-works">Gather</a>.</p>
        <p>The <a href="/how-it-works">Gather</a> is not a lecture with better lighting. Four to eight men. Small is the point. Every man can be heard, or the room turns into a stage and somebody starts performing.</p>
        <p>There is a Guide. He is not the expert and he is not the pastor of the hour. He prepared. He holds the room. He asks questions drawn from the book and from real life. The role rotates. The first time you Guide, it is uncomfortable. That is expected. Sitting in the circle forms you one way. Leading it forms you another.</p>
        <p>We skip &ldquo;how are you.&rdquo; That question gets a performance. The question is where are you, really. The Guide goes first so the room knows what honesty looks like tonight. One sentence or one minute. Nobody jumps in to fix it. The room listens. That alone is rarer than most men will admit.</p>
        <p>What is said in the room stays in the room. That is the agreement, every time. First Gather, you can sit and listen the whole way. You do not have to have finished the book. Nobody chases you if it is not for you. If you come back, you are a Brother.</p>
        <p>We call it Crown &amp; Compass for a reason.</p>
        <p>The <strong>compass</strong> is the tools that get you there. The book in your hand. The six weeks that refuse to let you skim and bounce. The brothers who will text you when you go quiet — not with a pitch, not with a guilt trip, just with the door left where you can find it. The small practices that hold your bearing when life spins: a verse in the pocket, a hard question you do not dodge, a Friday night that is not only sedation.</p>
        <p>Tools are not the destination. That is the mistake a lot of men&rsquo;s groups make. They fall in love with the kit — the app, the brand, the language — and forget what the kit was for.</p>
        <p>The <strong>crown</strong> is the destination. A life ordered under Christ the King. Weight. Clarity. A man who knows where he is pointed when the fight gets loud and the week gets thin. Not a trophy on a shelf. Not a logo. The end we are aiming at while we walk.</p>
        <p>Faith here is not a speech you applaud and leave on the chair. It is the bearing. You see it in a man who tells the truth at the table. You see it when somebody names the compromise that has been quietly draining his strength. You see it when the room does not flinch, and does not rush to sand it down into something nicer.</p>
        <p>That is why the Fight Club line stays.</p>
        <p>We are not punching each other in a basement. We are refusing the polite lie that a man can white-knuckle the whole war alone and call it strength. Iron sharpens iron in rooms where the book is open and the performance is off. The fight does not end because you found a chapter. The fight gets witnesses. And a witness changes what a man will carry by himself.</p>
        <p>One book. Six weeks. Then we <a href="/how-it-works">Gather</a>.</p>
        <p>Pull up a chair.</p>
        <p class="signoff">Brian</p>', '2026-09-19', 'blog/2026/09/fight-club-with-books/01.png', 'Fight Club with books', 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'fight-club-with-books');
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = 'fight-club-with-books'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, '{"slug":"fight-club-with-books","source":"static:fight-club-with-books"}', 1 FROM blog_posts p WHERE slug = 'fight-club-with-books'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');
INSERT INTO blog_tags (slug, label) VALUES ('brotherhood', 'Brotherhood')
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;
INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = 'fight-club-with-books' AND t.slug = 'brotherhood';
UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = '2026-09-19 12:00:00',
         current_rev = 2, updated_at = '2026-09-19 12:00:00'
     WHERE slug = 'fight-club-with-books' AND status = 'draft';
INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = 'fight-club-with-books'
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);
INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, '{"slug":"fight-club-with-books","source":"static:fight-club-with-books"}', 1 FROM blog_posts p WHERE slug = 'fight-club-with-books'
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');
