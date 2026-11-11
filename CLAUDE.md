# Instructions pour Claude

Avant d'ajouter, de modifier, de déplacer ou de supprimer un message affiché au joueur (fenêtre, scène, conseil de Camille, bulle, alerte, « Nouveau ! », toast), lire `RYTHME.md` et respecter ses règles. Après un tel changement, mesurer avec `outils/frise-messages.js` (règle 9).

Mise en page en paysage : depuis la v585, toutes les règles `@media (orientation: landscape)` sont dans une seule feuille, `<style id="paysage">`, rangée par condition puis par zone de l'écran. Ne pas ajouter de bloc paysage ailleurs : écrire la règle dans cette feuille. Après tout changement de mise en page (portrait ou paysage), lancer `node outils/test-ecrans.js` (objectif : 0 caché, 0 dehors, 0 déborde, 0 vide).

Minuteries et observateurs (v658-v659) :
- `setInterval` est remplacé par un ordonnanceur commun (une seule minuterie, réveillée à l'heure de la prochaine échéance ; premier script de la page). Rien à changer pour la logique du jeu.
- Une correction d'interface (repositionner, renommer, ré-étiqueter un bouton, balayer un texte) ne s'écrit plus avec `setInterval` mais avec `__uiv(f, délai)` : `f` est appelée quand l'écran a pu changer (fenêtre ouverte ou modifiée, onglet, toucher, redimensionnement, appel à `ui()`) et toutes les 3 s par sécurité si quelque chose a changé. La passe est étalée : au plus ~4 ms par image, la suite à l'image d'après, et une seule passe à la fois (v665). Exception : quand une fenêtre s'ouvre (#m, #fmo, #vig…), toutes les corrections tournent d'un coup avant son premier affichage (v666). Une correction ne doit réécrire que si le contenu change, en comparant avec `txa(el)` / `hxa(el)` (texte / HTML où les icônes pixel redeviennent des émojis) : sinon la pose des icônes relance la passe en boucle. Une correction doit donc rester courte et ne pas supposer qu'une autre a tourné dans la même image.
- Les émojis deviennent des icônes pixel (`<img class="pxg" alt="🏘️">`) dès leur arrivée dans la page, avant les corrections `__uiv`. Pour relire le texte d'un élément (le comparer, le tester, ou le reconstruire), utiliser `txa(el)` et non `el.textContent`, qui ignore les images. Une nouvelle icône s'ajoute dans la table `MAP` (v534).
- Ne pas observer `document.body` avec `subtree`. Utiliser `__obsIn(['id'], f, options)` pour observer une fenêtre ou un écran précis quand il existe, ou `__bodyMut(f)` seulement si tout le document doit être vu.
- `ui()` est limitée à une exécution toutes les 250 ms, y compris tout ce qui l'enveloppe (v669) : `W('ui',…)` ne s'exécute donc pas à chaque appel. Pour un affichage immédiat après un geste du joueur, appeler `uiNow()`.
- Mesurer sur téléphone : ajouter `#perf` à l'adresse du jeu (compteur par image : jeu, interface, minuteries, navigateur).
- Après un changement de ce type, mesurer avec `node outils/minuteries.js URL` (objectif : moins de 100 appels par seconde, moins de 10 ms de calcul par seconde).

Styles (v678) :
- Ne pas écrire de règle CSS `body:has(…)` : chaque changement dans la page oblige alors le navigateur à tout revérifier. Les 29 conditions existantes sont devenues des classes sur `<body>` (`hq0`, `hq1`…), tenues à jour par le script « v678 » placé après `__bodyMut` (table `A`). Pour une nouvelle condition, ajouter le sélecteur à cette table et écrire la règle avec `body.hqN`.
- Dessin : `#perf` détaille le temps du dessin ; `#nocache` coupe le cache du décor des salles, `#nobmp` les copies figées, `#fx` le mode « effets réduits » des téléphones lents (`window.LOWFX`).

Nettoyage v683 :
- `sauvegarde-v682.html` est la copie de la version d'avant, jouable à cette adresse : ne pas la modifier.
- Corrections des onglets : une correction qui ne touche que le panneau des onglets commence par `if(window.__panClosed&&__panClosed(f))return;` (elle ne fait rien panneau fermé, et `f` est rappelée à l'ouverture, avant le premier affichage).
- Ne pas lire `innerWidth` / `innerHeight` ni `getBoundingClientRect()` dans le dessin (`draw` et ce qui l'enveloppe) : cela force une mise en page à chaque image. Garder la valeur en mémoire et la rafraîchir sur `resize`.
- Ne pas ajouter de couche autour des méthodes du canevas (`CanvasRenderingContext2D.prototype`) : passer par `__setCvHook` (script v674).

Partie témoin (v684) :
- Avant et après tout nettoyage ou réécriture du code (fusion de couches, déplacement de script, changement d'une fonction du jeu), comparer l'ancienne et la nouvelle version : `node outils/partie-temoin.js AVANT APRES départ 1500`, pour les trois départs `debut`, `an2` et `an3` (objectif : « identiques » trois fois). `sauvegarde-v682.html` peut servir de référence tant que le comportement du jeu n'a pas été changé exprès.
- Un changement voulu du comportement (équilibrage, nouvelle scène, nouveau message) rend les parties différentes : c'est normal, vérifier seulement que la première différence est bien celle attendue.
- Le script simule l'horloge et le hasard : ne pas lire l'heure ni tirer au hasard par un autre moyen que `performance.now()`, `Date`, `setTimeout`, `setInterval`, `requestAnimationFrame` et `Math.random()`, sinon la partie n'est plus reproductible.

CSS mort et images refaites (v685-v688) :
- `outils/css-mort/` retire les déclarations CSS prouvées mortes (mode d'emploi dans son `LISEZMOI.md`). Après un passage : `4-verif.js` (0 anomalie), partie témoin, contrôle des écrans.
- Objets dessinés par des images de l'IA (v688) : une seule feuille `window.IAS` (dans `<head>`), table `IAM`, dessin par `iaD(nom, X, Y, largeur, hauteur)` ; enseigne par `iaSign`. Les textes (HSA, VOTEZ, slogans) restent écrits par le jeu. Pour ajouter un objet : le réduire à sa vraie grille de pixels (`pix.py`, gardé hors dépôt), l'ajouter à la feuille et à `IAM`, et garder l'ancien dessin en repli quand `iaOK()` est faux.
- Épilogue en vue inclinée : la bulle d'un·e salarié·e porte son portrait, son nom et son métier (`bub(..., who)`), et reste affichée 1 s + 40 ms par caractère.
