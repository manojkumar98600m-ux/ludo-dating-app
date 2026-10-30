# Ludo Dating — backend setup (Hindi)

GitHub source repo connected hone ka matlab yeh nahi ki Supabase backend bhi automatically connect ho gaya. Real online account/chat ke liye neeche ek one-time setup zaroori hai.

## Supabase backend banana
1. https://supabase.com par account bana kar New project create karein.
2. Project ke SQL Editor mein `backend/supabase-schema.sql` ka poora SQL paste karke Run karein.
3. Authentication > Providers mein Email provider enable karein.
4. Project Settings > API (ya API Keys) se **Project URL** aur **anon/public/publishable key** copy karein.
5. In dono ko `website/supabase-config.js` mein `url` aur `anonKey` fields mein paste karein. Yeh public browser key hoti hai.
6. **service_role / secret key kabhi website, GitHub ya APK mein mat daalein.**
7. Supabase Dashboard mein Database > Publications/Realtime mein `messages`, `game_rooms`, aur `game_room_players` ke realtime updates enable karein, agar realtime use kar rahe hain.

## Zaroori sach
- `website/connect.html` abhi local demo hai; config file aur SQL akelay usko live online app nahi banate. Frontend integration aur alag accounts se testing abhi baaki hai.
- Multiplayer Ludo ke moves/dice ko trusted server/Edge Function par validate karna hoga. Sirf browser state secure multiplayer nahi hai.
- Launch se pehle RLS/security review, report/block moderation, account deletion, privacy policy, rate limits aur applicable laws ki review karein.
