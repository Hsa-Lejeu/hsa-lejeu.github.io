# Rythme des messages — règles du jeu HSA

Ce fichier fixe comment et quand le jeu parle au joueur. Toute modification qui ajoute, déplace ou supprime un message (fenêtre, scène, conseil, bulle, alerte, nouveauté) doit respecter ces règles. En cas de doute, demander avant de coder.

Origine : inventaire et mesure du 2 novembre 2026 (v515). Au début de partie, le joueur recevait un message toutes les 5 secondes après l'ouverture, par dix canaux qui avaient chacun leur propre règle d'attente.

## 1. Trois niveaux, pas plus

Chaque message appartient à un seul niveau.

| Niveau | Pour quoi | Forme | Canaux actuels concernés |
| --- | --- | --- | --- |
| 1. Bloquant | Danger (surdose, accident), décision à prendre, bilan, chapitre | Fenêtre qui met le jeu en pause | Fenêtre plein écran (`#m`), scène illustrée (`popWin`), réunion de saison (`MEET`) |
| 2. Alerte persistante | Une action est attendue du joueur (salle fermée, appel, caisse basse, quartier à bout) | Pastille sur le plan ou sur le bandeau, reste tant que le problème existe, mène à l'action | Depuis la v532, plus aucun bandeau (`#alst` masqué) : ❗ à côté de l'argent (caisse basse) et sur la jauge du quartier (quartier à bout), « ! » sur les onglets Soins (naloxone) et Équipe (départ), icône au bord de l'écran avec une flèche pour un appel ou une salle fermée hors de la vue (`.edg`) |
| 3. Information | Tout le reste : retour d'action, astuce, nouveauté, ambiance | Non bloquant, disparaît seul | Bulle de Camille (`camSay`/`say`), conseils (`ctip`), toast de bilan, bannière. Depuis la v532, « Nouveau ! » (`ulSide`) n'est plus qu'un signe ✦ sur l'onglet concerné |

Un message qui ne demande ni décision ni action est de niveau 3, même s'il est important pour la pédagogie.

## 2. Un seul aiguilleur

Tous les messages passent par une file unique (l'aiguilleur). Aucun canal n'affiche directement : `popWin`, `ctip`, `ulSide`, `camSay`/`say`, les ouvertures de `#m` et les alertes déposent leur message dans la file avec son niveau et sa priorité. L'aiguilleur applique les règles 3 à 6.

Mis en place en v520 (objet `window.AG`, fin du code) :

- `popWin`, `ctip`, `ulSide` et `camSay` sont enveloppés : ils déposent leur message dans `AG.q` au lieu d'afficher.
- La fenêtre `#m` est surveillée : une ouverture décidée par le jeu (pas par un geste du joueur) est mise en attente si une autre fenêtre est à l'écran ou si le délai de la règle 4 n'est pas écoulé. Son contenu est mis de côté avec ses boutons et la partie continue.
- Ne sont jamais retardés : les dangers, les bilans, les chapitres, ce que le joueur ouvre lui-même (geste de moins de 0,4 s) et une fenêtre qui se redessine (fermée puis rouverte en moins de 1,5 s). La réunion de saison suit le bilan du mois sans délai, car elle s'ouvre quand le joueur ferme ce bilan.
- L'horloge de l'aiguilleur (`AG.clock`) ne compte que le temps hors pause et hors fenêtre bloquante.
- Les « Nouveau ! » et les conseils ne sont jamais abandonnés. Seuls les retours d'action de la bulle le sont après 30 s.
- `AG.log` garde la trace des ouvertures de `#m` (montrée, différée, geste du joueur).
- **Toute nouvelle fenêtre passe par `openM(html, opts)`** (v589), qui la dépose dans la file de l'aiguilleur (`AG.push`) avec sa priorité (`opts.pri` : 1 danger, 2 décision, 3 bilan, 4 récit). Ne plus écrire `$('m').hidden=false` : la redéfinition de `hidden` sur `#m` ne reste que comme filet de sécurité pour les fenêtres anciennes.

## 3. Une seule chose à la fois

- Une seule fenêtre bloquante à l'écran.
- Pendant une fenêtre bloquante, rien d'autre n'apparaît : ni conseil, ni « Nouveau ! », ni bulle, ni alerte par-dessus. Les messages attendent dans la file.
- Un seul message de niveau 3 à la fois. Un message de niveau 3 n'efface jamais le précédent avant son temps de lecture (règle 5) : il attend son tour.

## 4. Délais minimum

Les délais se comptent en secondes de jeu non en pause, à vitesse ×1.

| Entre… | An 1 | Ans 2 et 3 |
| --- | --- | --- |
| Deux fenêtres bloquantes non urgentes | 40 s | 20 s |
| La fin d'un bilan, d'un chapitre ou d'une réunion et le prochain récit (rencontre, lettre, imprévu) | 5 jours de jeu | 5 jours de jeu |
| Deux conseils de Camille | 60 s | 60 s |
| Deux messages de niveau 3 | 6 s | 6 s |

Exceptions, qui passent avant tout délai : un danger (surdose, accident d'exposition) et ce que le joueur ouvre lui-même (onglet, salle, panneau).

## 5. Temps de lecture

Un message de niveau 3 reste affiché au moins 1 s + 40 ms par caractère, sans plafond inférieur à ce calcul. S'il est trop long pour être lu ainsi, il est trop long : le raccourcir ou le passer en fenêtre.

## 6. Priorités dans la file

1. Danger
2. Décision attendue (choix, appel d'un·e collègue)
3. Bilan, chapitre, réunion
4. Récit (rencontre, lettre, imprévu, rendez-vous)
5. Information (retour d'action, astuce, nouveauté)

À priorité égale, le plus ancien passe d'abord. Les messages de niveau 3 trop vieux (plus de 30 s de jeu dans la file) sont abandonnés : un retour d'action périmé n'a plus de sens.

## 7. Conseils de Camille

- Déclenchés par une situation du jeu, jamais par une minuterie.
- Jamais répétés (mémorisés dans la sauvegarde, y compris après « Recommencer l'année »).
- Jamais affichés après que le joueur a déjà fait l'action qu'ils expliquent.

Décisions prises sur la liste actuelle (inventaire du 2 novembre) :

| Clé | Déclencheur | Décision |
| --- | --- | --- |
| hi | la halte vient d'ouvrir | Garder |
| syr | une seringue traîne dehors | Garder |
| card | première carte gagnée | Garder |
| score | 4 personnes accompagnées | Garder |
| tired | un·e collègue sous 55 d'énergie | Garder |
| eu | 2e mois ou budget sous 700 € | Espacer |
| stock | moins de 2 naloxone | Rétrograder en alerte persistante (niveau 2) |
| das | une boîte DASRI à 6/10 | Rétrograder en alerte persistante (niveau 2) |
| quart | onglet Quartier débloqué | Rétrograder en simple « Nouveau ! » |
| acc | 1 personne accompagnée | Supprimer |
| unl | première nouveauté | Supprimer |
| wheel | 3 personnes accompagnées | Supprimer |
| spd | 5 personnes accompagnées | Supprimer |
| call | un·e collègue appelle | Supprimer (l'alerte d'appel suffit) |
| room | salle de soins débloquée | Supprimer (le « Nouveau ! » suffit) |
| date | 20e jour du premier mois | Supprimer |
| yr | 2e mois | Supprimer |
| bub | une personne attend avec une bulle | À discuter |
| q | pétition ou tranquillité −4 | À discuter |

## 8. Bulle de Camille

La bulle reprend aujourd'hui automatiquement les 265 appels à `say()`. Chaque appel doit être classé :

- **montrer** : reste un message de niveau 3 dans la file ;
- **regrouper** : fusionné avec d'autres messages du même type (par exemple les retours d'action d'un même jour) ;
- **taire** : n'apparaît plus dans la bulle (il peut rester dans le journal ou les nouvelles).

Par défaut, un nouveau `say()` est « taire » tant qu'il n'a pas été classé.

## 9. Vérifier

Après chaque version qui touche aux messages, relancer l'enregistrement des quatre premières minutes (nouvelle partie, format téléphone) avec `node outils/frise-messages.js` (mode d'emploi en tête du fichier). Le script affiche un résumé comparé aux objectifs ci-dessous.

Objectifs :

- avant l'ouverture : pas plus de 2 fenêtres bloquantes en dehors du guide ;
- après l'ouverture : pas plus de 5 messages par minute, tous canaux confondus (11,7 mesurés le 2 novembre sur la v515, 13,7 sur la v517) ;
- aucune paire de fenêtres bloquantes non urgentes à moins du délai de la règle 4 ;
- rien d'affiché par-dessus une fenêtre bloquante.
