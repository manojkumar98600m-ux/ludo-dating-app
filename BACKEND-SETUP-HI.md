# Ludo Dating — backend setup (Hindi)

APK ka build successful hai, lekin asli online account/chat/multiplayer ko live karne ke liye backend project aur credentials zaroori hain. Yeh files us setup ko ready karne ke liye hain.

## Supabase backend banana
1. https://supabase.com par account bana kar New project create karein.
2. Project ke SQL Editor mein `backend/supabase-schema.sql` ka poora SQL paste karke Run karein.
3. Authentication > Providers mein Email provider enable karein. Signup ke liye email confirmation policy apni zaroorat ke mutabiq set karein.
4. Project Settings > API se Project URL aur anon/publishable key lein. **service_role/secret key kabhi website, GitHub ya APK mein mat daalein.**
5. Database > Publications/Realtime mein `messages`, `game_rooms`, aur `game_room_players` ke realtime updates enable karein.
6. Deploy website par environment/config ko set karna hoga aur frontend ko Supabase client se connect karna hoga. URL/key bina live backend connect nahi ho sakta.

## Important
- Schema mein RLS policies hain, lekin launch se pehle security review/testing phir bhi zaroori hai.
- Real-time Ludo mein server-side turn/dice validation aur room lifecycle Edge Functions/backend mein implement karna hoga; client-only game state ko secure multiplayer na samjhein.
- Is project ka current connect screen local demo hai. SQL add karna akela us screen ko live login/chat mein convert nahi karta.
- Dating service public launch se pehle age gating, privacy policy, report/block moderation, account deletion, abuse handling, backups, rate limits aur applicable laws ki review zaroor karein.
