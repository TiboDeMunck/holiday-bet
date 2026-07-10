# Waar gaan we op reis?

Een kleine privé-poll voor een vriendengroep.

## Spelregel

Een deelnemer kan meerdere bestemmingen kiezen en per bestemming een aantal adjes inzetten.

Na de onthulling:

- zelf drinken = totale inzet - inzet op de juiste bestemming
- uitdelen = 2 × inzet op de juiste bestemming

Voorbeeld: Nederland 1, Duitsland 2, Turkije 3. Als Nederland correct is, drink je 5 en deel je 2 uit.

## Installeren

1. Kopieer deze bestanden naar je GitHub-project.
2. Installeer de dependencies:

   npm install

3. Maak een Supabase-project.
4. Open **SQL Editor** in Supabase en voer `supabase/schema.sql` volledig uit.
5. Kopieer `.env.example` naar `.env.local`.
6. Vul de drie environment variables in.
7. Start lokaal:

   npm run dev

De poll staat op `http://localhost:3000`.

Beheer staat op `http://localhost:3000/admin`.

## Supabase-sleutels

- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API → service_role

De service-role key mag uitsluitend als server-side environment variable worden opgeslagen. Zet hem nooit in browsercode of in GitHub.

## Vercel

Voeg dezelfde drie environment variables toe onder:

Project → Settings → Environment Variables

Deploy daarna opnieuw.

## Beperkingen van deze eerste versie

- Identiteit is gekoppeld aan één browser via localStorage.
- Deelnemersnamen zijn hoofdletterongevoelig uniek.
- Iemand kan technisch opnieuw deelnemen via een andere browser of incognitovenster.
- Er is één vaste poll.
- Deelnemers kunnen een bestaande inzet aanpassen zolang de poll open is.
- Er is nog geen verwijderknop voor inzetten.

## Definitief opslaan

Inzetten worden eerst als concept bewaard. De deelnemer klikt daarna op **Klaar met inzetten**, controleert alles en kiest **Definitief opslaan**. Vanaf dat moment zijn nieuwe of gewijzigde inzetten geblokkeerd en opent de site voortaan meteen het overzicht.

## IP-adres

Bij het invoeren van de naam wordt het door Vercel doorgestuurde publieke IP-adres opgeslagen. Dit wordt niet gebruikt als unieke login, omdat meerdere mensen op hetzelfde netwerk hetzelfde publieke IP-adres kunnen hebben. De browser-ID blijft de identificatie voor terugkerende bezoekers.

Bij een bestaande Supabase-database moet je het bijgewerkte `supabase/schema.sql` nogmaals uitvoeren. De toegevoegde kolommen gebruiken `if not exists`.

## Privacy en unieke namen

De applicatie bewaart geen IP-adressen. Namen worden genormaliseerd en mogen maar één keer voorkomen. `Tibo`, `tibo` en ` Tibo ` gelden dus als dezelfde naam.
