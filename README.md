# Le Pendu

Jeu du pendu — solo (100% local) et multijoueur (Firebase Realtime Database).

## Structure

```
index.html
css/style.css
js/wordbank.js        → banque de mots (thèmes + difficulté)
js/engine.js           → moteur de jeu pur (utilisé en solo)
js/hangman-svg.js       → dessin SVG du pendu, style marqueur à main levée
js/firebase-init.js     → config Firebase (À REMPLIR)
js/multiplayer.js       → logique des salons multijoueur
js/main.js              → routing + UI
```

## Mise en route

1. **Solo** : fonctionne tel quel, aucune config nécessaire. Ouvre `index.html`.
2. **Multijoueur** : ouvre `js/firebase-init.js` et remplace les valeurs `REMPLACE_MOI`
   par la config de ton projet Firebase (tu peux réutiliser le **même projet que
   BuzzArena** — ce jeu écrit dans un nœud séparé `/pendu_rooms`, aucun conflit).
   - Active **Authentication > Anonyme** dans la console Firebase si ce n'est pas
     déjà fait pour BuzzArena.
   - Vérifie que les **règles Realtime Database** autorisent la lecture/écriture
     pour les utilisateurs authentifiés sur `/pendu_rooms`, par exemple :
     ```json
     {
       "rules": {
         "pendu_rooms": {
           "$code": {
             ".read": "auth != null",
             ".write": "auth != null"
           }
         }
       }
     }
     ```

## Modes multijoueur

- **Mode A — Manche collective** : le mot est tiré automatiquement de la banque
  (thème/difficulté choisis par l'hôte). Les joueurs proposent une lettre à
  tour de rôle. **N'importe quel joueur peut, à tout moment (même hors tour),
  tenter de deviner le mot entier** via le champ dédié. Bonne réponse = victoire
  immédiate. Mauvaise réponse = une erreur en plus pour le groupe.
- **Mode B — Mot secret** : l'hôte tape lui-même un mot et invite ses camarades
  avec le code du salon. L'hôte ne joue pas — les autres devinent à tour de
  rôle, avec la même possibilité de "buzzer" le mot entier à tout moment.
  Si le pendu est complet, l'hôte gagne.

## Limite connue (V1)

Le mot est stocké en clair dans la Realtime Database pour rester simple (pas de
backend). Un joueur un peu curieux pourrait le lire via les outils développeur.
Suffisant pour une partie entre amis/étudiants ; si tu veux blinder ça plus tard,
il faudra passer par une Cloud Function qui garde le mot côté serveur.

## Déploiement (GitHub Pages)

Même procédure que BuzzArena/Verso Recto : pousse ce dossier sur un repo GitHub,
active GitHub Pages sur la branche principale.
