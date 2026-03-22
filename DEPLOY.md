# Déploiement - AB Testing by Antoon

## Étape 1 — Préparer la base de données (Supabase)

1. Va sur **supabase.com** → ton projet → **SQL Editor**
2. Colle le contenu du fichier `schema.sql` et clique **Run**
3. Va dans **Settings → API** et note :
   - `Project URL` → c'est ton `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → c'est ton `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secret) → c'est ton `SUPABASE_SERVICE_ROLE_KEY`

---

## Étape 2 — Mettre le code sur GitHub

Ouvre un terminal sur ton Mac (**Terminal** dans Applications) et tape :

```bash
cd "/Users/anthony/Downloads/Perso Anto/Projets Perso/AB Test"
git init
git add .
git commit -m "Initial commit - AB Testing by Antoon"
```

Ensuite sur **github.com** :
1. Clique **New repository**
2. Nom : `ab-testing-antoon`
3. Clique **Create repository**
4. Copie les commandes affichées sous "push an existing repository" et exécute-les dans le terminal

---

## Étape 3 — Déployer sur Vercel

1. Va sur **vercel.com** → **Add New Project**
2. Sélectionne ton repo `ab-testing-antoon`
3. Clique **Deploy** (Vercel détecte automatiquement Next.js)
4. Une fois déployé, va dans **Settings → Environment Variables** et ajoute :

| Nom | Valeur |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ton URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ta clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | ta service role key |

5. Va dans **Deployments → Redeploy** pour appliquer les variables

---

## Étape 4 — Utiliser l'outil

1. Ouvre ton URL Vercel (ex: `ab-testing-antoon.vercel.app`)
2. Clique **Ajouter un site**
3. Entre dans ton site → copie le code d'installation → colle-le dans le `<head>` de ton site client
4. Crée une expérience → ajoute les changements → **Lance le test**
5. Surveille les résultats en temps réel

---

## Structure des fichiers

```
├── app/
│   ├── page.tsx                    # Dashboard principal
│   ├── sites/new/page.tsx          # Créer un site
│   ├── sites/[id]/page.tsx         # Détail site + code snippet
│   ├── experiments/new/page.tsx    # Créer une expérience
│   ├── experiments/[id]/page.tsx   # Résultats en temps réel
│   └── api/
│       ├── config/route.ts         # Appelé par le snippet
│       ├── track/route.ts          # Reçoit les événements
│       ├── sites/route.ts          # CRUD sites
│       └── experiments/            # CRUD expériences
├── lib/
│   ├── supabase.ts                 # Client DB + types
│   └── stats.ts                   # Calcul statistiques A/B
├── public/
│   └── snippet.js                  # Script injecté chez les clients
└── schema.sql                      # À coller dans Supabase
```
