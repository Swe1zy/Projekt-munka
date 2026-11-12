# Stripe tesztüzem beállítása

1. A `backend/.env` fájlban töltsd ki a Stripe Dashboard **tesztmódú** titkos kulcsát a `STRIPE_SECRET_KEY` változóban. A kulcs csak a backendben legyen; ne tedd a frontend `.env` fájlba, forráskódba vagy Gitbe.
2. Indítsd el a backendet a `backend` mappából: `npm run dev`.
3. A webhook végpont címe: `http://localhost:3600/api/rendelesek/stripe-webhook`. A Stripe CLI-vel továbbítsd ide az eseményeket: `stripe listen --forward-to localhost:3600/api/rendelesek/stripe-webhook`.
4. A Stripe CLI által kiírt webhook signing secretet másold a `STRIPE_WEBHOOK_SECRET` változóba, majd indítsd újra a backendet. A kezelt események: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`.
5. A frontend a `http://localhost:5173` címen fusson. A pénztárban válaszd a bankkártyás fizetést; fizetéshez használj Stripe tesztkártyát a Stripe hivatalos tesztmódjának megfelelően.

Éles használathoz a tesztkulcsokat éles kulcsokra kell cserélni, és az éles webhookot a nyilvánosan elérhető backend URL-re kell beállítani. A bankkártyaadatokat a Stripe Checkout kezeli; az alkalmazás nem tárolja azokat.
