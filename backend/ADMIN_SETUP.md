# Admin fiók beállítása

A backend induláskor létrehozza vagy frissíti az admin fiókot MongoDB-ben. A jelszó csak bcrypt hashként kerül az adatbázisba; a forráskód nem tartalmazza.

1. A `.env.example` fájlban szereplő admin és hitelesítési sorokat másold be a `backend/.env` fájlba. A meglévő `MONGO_DB` és Cloudinary-beállításokat ne írd felül.
2. Az `ADMIN_PASSWORD` értékéhez add meg a kért admin jelszót. Az `AUTH_TOKEN_SECRET` helyére generálj legalább 32 véletlen bájtból álló, egyedi titkot; ne használd újra az admin jelszavát.
3. A `FRONTEND_URL` értéke egyezzen a frontend böngészőben használt originjével (alapértelmezett Vite cím: `http://localhost:5173`).
4. Indítsd újra a backendet. A konzol jelzi, ha az admin fiók elkészült.
5. A frontend bejelentkezés oldalán az `Admin01@gmail.com` címmel és a beállított jelszóval jelentkezz be. Admin jogosultsággal megjelenik a **Termékkezelés** menüpont.

A munkamenet aláírt, HttpOnly cookie-ban van. A termékfeltöltési, módosítási és törlési API-k minden kérésnél a MongoDB-ben tárolt admin szerepkört ellenőrzik; a frontend oldali jogosultság-ellenőrzés önmagában nem ad hozzáférést.
