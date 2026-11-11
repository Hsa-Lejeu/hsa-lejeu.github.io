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
- Version de référence d'avant le nettoyage : `git show 3c4991d^:index.html` (v682). La copie `sauvegarde-v682.html` a été retirée du site en v689.
- Corrections des onglets : une correction qui ne touche que le panneau des onglets commence par `if(window.__panClosed&&__panClosed(f))return;` (elle ne fait rien panneau fermé, et `f` est rappelée à l'ouverture, avant le premier affichage).
- Ne pas lire `innerWidth` / `innerHeight` ni `getBoundingClientRect()` dans le dessin (`draw` et ce qui l'enveloppe) : cela force une mise en page à chaque image. Garder la valeur en mémoire et la rafraîchir sur `resize`.
- Ne pas ajouter de couche autour des méthodes du canevas (`CanvasRenderingContext2D.prototype`) : passer par `__setCvHook` (script v674).

Partie témoin (v684) :
- Avant et après tout nettoyage ou réécriture du code (fusion de couches, déplacement de script, changement d'une fonction du jeu), comparer l'ancienne et la nouvelle version : `node outils/partie-temoin.js AVANT APRES départ 1500`, pour les trois départs `debut`, `an2` et `an3` (objectif : « identiques » trois fois). Comme référence, tirer l'ancienne version de git (`git show <commit>:index.html > ancienne.html`, à servir à côté de `three-r128.min.js` et `fonts/`). La typographie (espaces insécables, apostrophes) est ignorée dans la comparaison.
- Un changement voulu du comportement (équilibrage, nouvelle scène, nouveau message) rend les parties différentes : c'est normal, vérifier seulement que la première différence est bien celle attendue.
- Le script simule l'horloge et le hasard : ne pas lire l'heure ni tirer au hasard par un autre moyen que `performance.now()`, `Date`, `setTimeout`, `setInterval`, `requestAnimationFrame` et `Math.random()`, sinon la partie n'est plus reproductible.

CSS mort et images refaites (v685-v688) :
- `outils/css-mort/` retire les déclarations CSS prouvées mortes (mode d'emploi dans son `LISEZMOI.md`). Après un passage : `4-verif.js` (0 anomalie), partie témoin, contrôle des écrans.
- Objets dessinés par des images de l'IA (v688) : une seule feuille `window.IAS` (dans `<head>`), table `IAM`, dessin par `iaD(nom, X, Y, largeur, hauteur)` ; enseigne par `iaSign`. Les textes (HSA, VOTEZ, slogans) restent écrits par le jeu. Pour ajouter un objet : le réduire à sa vraie grille de pixels (`pix.py`, gardé hors dépôt), l'ajouter à la feuille et à `IAM`, et garder l'ancien dessin en repli quand `iaOK()` est faux.
- Épilogue en vue inclinée : la bulle d'un·e salarié·e porte son portrait, son nom et son métier (`bub(..., who)`), et reste affichée 1 s + 40 ms par caractère.

Sortie (v689) :
- three.js n'est plus dans la page : `three-r128.min.js`, chargé par `need3D()` à l'ouverture de la pétanque (`petaShow` l'attend). Ne pas lire `THREE` en dehors de la pétanque : un filet de sécurité le charge alors de façon synchrone et l'écrit dans la console (« three.js lu avant need3D »).
- Police Atkinson Hyperlegible dans `fonts/` (woff2, `<style id="police">`), plus aucun appel à Google Fonts.
- `sw.js` est produit par `python3 outils/mksw.py vNNN outils/images-sw.txt` (depuis la racine du site) : la page se rabat sur le cache si le réseau ne répond pas en 3 s ; musiques, police et three.js sont dans le cache durable (un fichier modifié doit changer de nom).
- La passe des icônes pixel pose aussi les espaces insécables (après «, avant », ?, !, ; et :) et remplace l'apostrophe droite entre deux lettres par ’, dans les nœuds de texte seulement. Le texte d'origine reste dans `n.__o` : `txa()` et `hxa()` le rendent, donc les corrections continuent de comparer avec les textes du code.
- Les scènes (`#fmo .fn`) n'ont plus d'icône devant leur nom.
- `oops(e, lieu)` n'écrit plus dans la console que les 3 premières erreurs d'un même lieu (puis une sur 500) ; le compte reste dans `window.__ERRS`.

Panneaux peints (v690-v692) :
- Enseignes de la halte (`window.IAE`), des boutiques (`window.IAN`, table `IANK` texte → image, dans `ens()`), et panneaux de la v692 dans `window.IAP` (table `IAPM`, dessin par `iaP(nom, X, Y)`) : grand panneau du square, plaques HSA, À LOUER, URGENCES, À VENDRE, TERRAIN À BÂTIR, affiche VOTEZ CROTTI (lettres posées à la main), tas de terre du terrain à bâtir (dessinés par le jeu, `tas1` à `tas3`), ÉPICERIE, et pour les petites scènes (`iaG(g, nom, X, Y)`) : spray de naloxone (`spray2` pour les kits), couverture et piles du magazine, panneau VENDU, affiches des rendez-vous de l'année (`rdv_tab`, `rdv_sida`, `rdv_sdp`, `rdv_iod`). Le texte est dans l'image ; l'ancien dessin reste en repli si l'image n'est pas chargée.

Une seule feuille d'images et fond des salles du quartier (v697) :
- `IAE`, `IAN` et `IAP` désignent maintenant la même image que `IAS` (une seule feuille, empilée : objets, enseigne de la halte, enseignes des boutiques, panneaux). Les tables `IANM` et `IAPM` portent déjà le décalage vertical ; l'enseigne de la halte se lit dans `IAER`. Pour ajouter une image : l'ajouter à la feuille et à sa table, sans créer de nouvelle `Image`.
- `binRoom` (murs et sols des salles visibles dans les bâtiments du quartier) dessine son fond une fois dans `BRC` puis le recopie : 268 `drawImage` de moins par image. `#nocache` coupe aussi ce cache.
- Mesures : `drawImage` par image 626 → 365 ; les couches `W(...)` ne pèsent qu'environ 1 % du temps de calcul, les fusionner n'apporte presque rien.

Pétanque (v698-v699) :
- Panoramas des six terrains refaits (images de l'IA, coupées au ras du sol et dé-jaunies : feuillages ramenés vers le vert, ocres moins saturés). `P3BG[terrain].pano` ; `panoA` = 2 × largeur / hauteur de l'image (elle est doublée en miroir autour du terrain).
- La Canebière n'est plus en pente (`SLOPE=0`). Toujours du vent (brise, vent ou mistral).
- Mise en scène « dernière boule » seulement si l'équipe ne tient pas le point (`joker`). Pendant le replay (`__RPLON`), le lanceur est effacé.
- Transitions entre les écrans de la pétanque : damier de gros pixels qui se résorbe en diagonale (`canvas.vtr`, script v699), à la place du balayage en biais.
- Entrée de l'accueil (v701) : marches (`marches`) devant la porte de l'accueil sur le parvis, remplacées par marches + rampe (`rampe`) quand `B.pmr` ; dessinées dans `draw()` juste après le carrelage du parvis, donc sous les personnages.
- Après les travaux PMR (v702) : seuil de l'accueil élargi au-dessus de la rampe ; Agnès entre par la rampe (`enter`) et ressort par elle (`outW`).

Épilogue en vue inclinée (v703) :
- Cassé depuis la v674 : les copies figées (v674), le cache des salles (v677, `binRoom` v697) et l'écartement des salles hors écran (v676) empêchaient l'épilogue d'enregistrer les objets. Pendant l'épilogue, `window.__HDON=1`, `__noCache=1` et `__noCull=1` coupent tout cela. Toute nouvelle copie figée ou nouveau cache doit tester `window.__HDON`.

Récit et copies figées (v705) :
- Une scène du fil rouge (Crotti, débat) porte `maj:1` dans son `popWin` : elle passe avec les décisions dans la file (RYTHME.md, règle 6).
- Copie figée d'une salle (`__rcEnd`) : la zone est d'abord recopiée tout de suite dans un canevas à part, puis figée par `createImageBitmap` ; ne pas appeler `createImageBitmap` directement sur le canevas du jeu (lecture différée sur certains téléphones : la salle clignotait).
