# Instructions pour Claude

Méthode de travail avec l'utilisateur (13 novembre 2026) :
- Un essai d'abord. Quand une image ou un décor doit recouvrir ou remplacer quelque chose d'existant (surtout sur le plan du quartier), en faire UN, l'envoyer et attendre l'avis avant de faire les autres.
- Planches de contrôle : toujours les rendre à partir de la version qui vient d'être publiée, avec les vrais personnages du jeu (évaluer la scène dans la portée du script principal), jamais à partir d'un rendu antérieur à la dernière correction. Si un rendu est partiel (personnages absents, scène non jouée), le dire dans la légende.
- Demande ambiguë (« enlève-le », « recule », « descends ») : poser une question d'une ligne avant de publier une interprétation.
- Un même type de défaut signalé deux fois : écrire un contrôle automatique (comme `outils/pieds-sur-meubles.js`) plutôt que corriger au cas par cas.
- Retours d'une autre IA transmis par l'utilisateur : elle travaille sur des captures ; vérifier dans le code avant d'agir (raccourci ou fonction supposés, objets déjà tirés du pack).

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
- Une scène du fil rouge (Crotti, débat, tournoi de pétanque, annonce d'un défi) porte `maj:1` dans son `popWin` : elle passe juste après les dangers dans la file (RYTHME.md, règle 6). `pri:N` fixe la priorité à la main (vote du conseil de quartier : `pri:3`). (v706)
- Invitations des référent·es : une par trimestre au plus (`B.invQ`). Un courrier de doléances différé est daté du jour où il s'affiche.
- Dans le script principal (celui de `upd`), `AMI()` n'est pas visible : écrire `(YR-1)*12+mo`.
- Panneau MAISON DE QUARTIER : image `mq` de `IAPM`, via `IAPK` dans `ens()`.
- Copie figée d'une salle (`__rcEnd`) : la zone est recopiée tout de suite dans un canevas ordinaire, qui sert tel quel de copie (plus d'`ImageBitmap` depuis la v718). Le scintillement des salles signalé sur le téléphone de l'utilisateur n'a jamais été reproduit sur le banc d'essai ; il disparaissait avec `#nocache`, mais avec aucun des deux caches coupé seul. Depuis la v719, les deux caches (copies figées des salles, `binRoom`) sont donc coupés par défaut ; `#cache` les rallume pour comparer. Coût mesuré sur le banc (processeur ×4 plus lent) : 19,4 → 17,9 images par seconde. Ne pas les rallumer par défaut sans avoir compris le défaut.

Retours des parties automatiques (v707) :
- Retrouvailles (`lcBack`, scène « Des nouvelles ») : proposée une seule fois par personne (`S.asked`).
- Paysage : `#hasc` et `#hasb` sont masqués quand un onglet est ouvert (`body.hq20`, feuille paysage).
- Expérience de l'équipe (`#xpov`) : `.xpw` est une colonne, `.xpl` défile, `.xpbt` reste en bas.
- `test-ecrans.js` : écrans `has-pastille`, `has-pastille-onglet`, `has-visite`, `has-visite-onglet`, `experience-12` ; contrôles « pastille par-dessus le panneau d'un onglet » et « bouton de l'expérience hors écran ».
- `partie-temoin.js` : le robot joue le débat (bonne carte, puis phrase visée) et referme un onglet resté ouvert ; la partie `an3` va jusqu'à la fin.

Fin de partie en paysage (v708) :
- Débat : éventail à `bottom: 50px`, cartes 70×99 ; bilan final : `.rvskip` flottant à droite sous le titre, hors du radar.
- Guide naloxone (`#nalg`) : fermé dès que la partie se termine (`ended`, `ENDING`, `__HDON`, `#epov`, `#tvov`), par `step`, par une correction `__uiv` et par une règle de style (`body.hq6`, `body.hq7`, `body.hdcin`). Les minuteries ne tournent pas quand le jeu est en pause ou terminé : ne pas compter sur un `setInterval` seul pour fermer quelque chose à la fin.
- Cris de la fête (`EPG`) : un seul point d'exclamation.
- Plaque LE SQUARE : image `square` de `IAPM`, dans `pancarte()`.

Boules de verre (v709) :
- Dans le choix des boules, `ballChip` dessine à part les deux boules de verre (`glassChip`) : `carte` = boule à neige de la Bonne Mère (image `__ndgImg`), `pastis` = verre à moitié plein. Une nouvelle boule de verre (script v618, `kind`) doit aussi y avoir sa vignette.

Tableau souvenir (v710-v711) :
- Panneau À VENDRE du camion : image `vendre2` de `IAPM` (dans `vanVDraw`). La boule `carte` s'appelle « La Bonne Mère ».
- Photo de la halte vue d'en haut à la place du rapport HAS : `halteSnap()` recopie la zone de la halte du canevas du jeu dans `window.__haltePh` toutes les 15 s (jamais pendant une réunion, la fin ou l'épilogue) ; le rapport HAS reste en repli si la photo manque.
- `draw(slogan, paysage, données, {lay, hit, skip, only, ch})` : chaque élément a une clé fixe posée juste avant son `item` (`NK='title'`, `team`, `dog`, `n0`…`n3`, `sign`, `halte`, `st0`, `st1`, `pc`, `news` ; `s0`… pour les autocollants). `lay` = `{o:{clé:[dx,dy]}, s:[{id,x,y}], z:[clés touchées]}`, gardé par format dans `LAYS` (`window.__shLay`). Pendant un glisser, le tableau sans l'élément (`skip`) et l'élément seul (`only`) sont dessinés une fois, puis seulement recomposés.
- Autocollants : table `STK` (icônes `HSAICO`/`HSAICO2`, spray de la feuille `IAS`, cœurs recolorés par `hue`, arc-en-ciel et rubans dessinés dans le code) ; 16 au plus ; on en retire un en le sortant du tableau.
- Raccourci de test (v712) : `…/?an=3#tableau` ouvre directement le tableau souvenir sur la partie de test.
- Tableau ouvert dès le début (v713) : bouton dans le menu ☰ et à l'accueil (`#splsh`, visible s'il y a une partie enregistrée ; `shareFromMenu()` reprend la partie puis ouvre le tableau). La fenêtre met le jeu en pause et rend la pause telle qu'elle était. Quatre onglets (`cur.tab`) : Texte (un slogan à la fois, flèches), Photos (éléments épinglés ou non, choix de la photo de l'équipe), Stats (quatre post-it parmi `STN`, valeurs dans `d.more`), Autocollants (cinq à la fois). Choix communs aux deux formats dans `CH` (`window.__shCh`) : `h` éléments masqués, `st` post-it, `ph` photo de l'équipe. Rien n'est encore enregistré avec la partie.
- Décisions du joueur·se pour la suite : aucun message quand un autocollant se débloque ; tous les slogans disponibles dès le début ; poing levé = avoir fait grève ; pas de logo officiel « Support. Don't Punish. » (autocollant original avec le slogan).
- Autocollants (v715) : `STK` a une 4e valeur, la taille sur le tableau (150 par défaut, 300 pour les autocollants à texte, 210 pour la médaille). Images `st_sdp`, `st_med`, `st_prol`, `st_droit`, `st_jdo` sur la feuille `IAS`. Un autocollant porte `b:1` quand il est à l'arrière-plan (dessiné sous les éléments épinglés) et `r` son inclinaison ; l'autocollant touché est `cur.sel` (cadre en pointillés dans l'aperçu seulement), boutons « Premier plan » / « Arrière-plan ».
- Le collectif de riverains du jeu s'appelle « Je dis oui HSA » (v714), avec l'accord du collectif marseillais #jedisOUI! HSA Marseille, cité en tête de « Pour aller plus loin » ; son logo est l'autocollant `jdo`.
- Pour savoir si une partie est lancée, tester `GAMEON` et non `started` : `started` ne devient vrai qu'à l'ouverture de la halte (accueil et salle de consommation pourvus). Le tableau, sa photo et son raccourci en dépendaient à tort (v716).
- Icône naloxone (v717) : `HSAICO.naloxone` (émoji 🆘 : achats, stock) est le spray nasal fourni par l'utilisateur, plus la trousse à pharmacie.
- Tableau souvenir (v718) : les scènes de la mascotte et de la gazette, la photo d'équipe par défaut et le fond de liège sont gardés (`SC_`, `FALLPH`, `BGC`) : ne pas redessiner une scène animée à chaque rendu. L'image PNG n'est fabriquée qu'au partage ou au téléchargement (`need`). Texte libre en couleur (`CH.free`, clé `free`, déplaçable). La photo de la halte est prise à l'ouverture du tableau et une fois à la fin de la partie, plus toutes les 15 s.
- Tableau souvenir (v719) : plusieurs textes libres (`CH.txt`, clés `f<numéro>` ; le texte en cours d'écriture est `cur.draft`, clé `fd`, validé par ✔) ; l'élément choisi est `cur.sel` (`s<rang>` ou `f<numéro>`) et la barre `.shsel` règle sa taille (`k`), son plan (autocollants seulement) ou l'enlève ; post-it sans limite (les suivants ont une place par défaut calculée) ; zoom de l'aperçu à deux doigts ou à la molette (`.shvp`, `zoom()`), un doigt sur le liège pour se déplacer, deux touchers pour revenir.
- Flèche « à vendre » du camion : `saleFx(364,146,16)` ; pancarte du centre de santé décalée de -4 dans `ens()`.
- Écran d'accueil (v720) : la pétanque et le tableau sont deux vignettes (`#spl_peta` à gauche, `#spl_tab` à droite) de part et d'autre de « Ma collection » et « À propos » (`.splrow`, construite par une correction `__uiv`) ; les anciens boutons `#splpet` et `#splsh` sont masqués. Déblocage : pétanque = tournoi atteint (`hsa-peta-menu`), tableau = première ouverture de la halte (`hsa-tab-menu`). « Nouveau ! » tant que `hsa-<clé>-seen` n'est pas posé ; pastille rouge quand le compte de nouveautés (`T[k].n()` : boules et terrains débloqués, photos souvenirs + `hsa-tab-unl`) dépasse `hsa-<clé>-cnt`, noté à la dernière visite. Les icônes viennent de `HSAICO2` (`boule`, `photo`) en attendant des images dédiées.

Places d'attente, panoramas, accueil (v721) :
- Scintillement des salles : c'étaient les personnes en attente (`v.s=='wait'`) qui se disputaient la même place. `spot(v)` ne comptait comme prises que les places visées par quelqu'un encore en marche ; une personne arrivée (`v.w` vide) libérait la sienne, la suivante la prenait, et les deux échangeaient à chaque image (sauts de 5 px en avance rapide). Une personne arrivée compte maintenant pour sa position. Rien à voir avec les caches du décor (toujours coupés par défaut, `#cache` pour comparer). Outil : enregistrer `V`/`STF` image par image et chercher les allers-retours A-B-A.
- Panoramas de la pétanque : six PNG en pixel art (grille réelle, 64 couleurs) dans `a/`, `panoA` = 2 × largeur / hauteur. Un panorama modifié change de nom (cache durable de `sw.js`) et sa ligne dans `outils/images-sw.txt`.
- Accueil : `#splpet`, `#splsh` masqués et boutons du milieu invisibles (`.sbox:not(.splok)`) dans la feuille du haut de page, jusqu'à ce que la rangée `.splrow` soit posée (`build` ajoute `splok` ; filet à 4 s). La page s'affiche avant la fin de l'analyse des scripts : un style posé par un script de fin de page arrive trop tard pour le premier affichage.
- Autocollants `bonnemere` (image `__ndgImg`) et `camion` (`OM.camper_r` de la feuille `OAT`).

Barre sombre dans les salles (v722) :
- Le vrai « scintillement des salles » : `furnList(r)` rejoue `roomFurn` avec `Q` détourné pour lister les meubles, mais les couches `W('roomFurn')` dessinaient alors pour de vrai (ombre de 7 px sous le mur, v. « DEPTH »), par-dessus l'image déjà finie. `srcs()` (vapeur, écrans) l'appelle toutes les 3 s depuis `W('draw')` : une bande sombre pendant une image, au niveau des bancs. `furnList` pose maintenant un masque vide (`clip` sur un rectangle nul) le temps de l'appel. Toute fonction qui rejoue un dessin « à blanc » doit faire de même.
- Banc d'essai : comparer le canevas d'une image à l'autre et chercher les lignes qui s'assombrissent d'un coup (5 défauts en 12 s avant, 0 après).
- Pétanque : `sink` du Vélodrome à 0,15 (cage du fond entière) ; lampadaires en 3D à l'échelle 1,15 (au lieu de 0,55) ; `__flagTex2(graine, [r,v,b], joint)` : dalles grises à la Canebière / Vieux-Port, claires à la Major.

Panoramas animés et caches rallumés (v723) :
- `window.__panoFx(terrain, image, canevas, texture)` (appelé au chargement du panorama) dessine les effets dans un calque aux coordonnées de l'image (1086 px de large) et le recolle dans la texture avec ses deux moitiés en miroir, toutes les 110 ms : reflets et vaguelettes sur l'eau (pixels bleus d'une zone `water`), mouettes (`gulls`), pétales ou feuilles (`fall`), guirlandes (`lights`), fumigènes (`smoke`) et flashs (`flash`) au Vélodrome. Table `C` par terrain. Rien si `window.LOWFX` ou `#nopanofx`. La minuterie s'arrête quand la texture change ou que la pétanque se ferme.
- Les deux caches du décor (copies figées des salles, `binRoom`) sont rallumés par défaut : le scintillement venait de `furnList` (v722), pas d'eux. `#nocache` les coupe.

Tableau souvenir (v724) :
- Depuis l'accueil, `shareFromMenu()` pose un voile `#shwait` (sous `#shov`) le temps que la partie se charge : le plan ne se voit plus avant le tableau.
- En portrait, dès que l'aperçu est zoomé, `#shov` prend la classe `zf` : `.shvp` passe en plein écran, `.shside` est masquée, bouton `.shzx` « Tableau entier » (ou deux touchers) pour revenir. `zoom()` convertit les coordonnées au changement de mode et centre le tableau s'il est plus petit que l'écran. Ne pas centrer un bouton du jeu avec `transform` : l'état enfoncé des boutons le remplace et le bouton saute sous le doigt.

Tableau souvenir « façon atelier » (v725) :
- Le liège prend l'écran (`.shw`), les outils sont une colonne d'icônes à droite (`.shrail` : fermer, quatre outils `.shtabs`, options `.shmore`, télécharger, partager). Icônes fournies par l'utilisateur, réduites à leur grille : table `SHI` (data-URL), `ic(nom)` rend `<img class="shi">`.
- `cur.tab` vaut `null` quand aucun outil n'est ouvert ; toucher une icône ouvre son tiroir (`.shside`, en bas), la retoucher ou toucher le liège le referme. Format et « Tout remettre en place » sont dans `.shopt` (bouton « … »). `.shmsg` est un message flottant qui s'efface seul.
- La barre de l'élément choisi (`.shsel`) flotte à côté de lui : `selBar()` la place après chaque `render()` et chaque `zoom()`.
- Paysage : règles dans `<style id="paysage">` (tiroir à gauche, boutons de la colonne plus petits).

Accueil, chargement, tableau (v726) :
- `#boot` (premier élément de `<body>`, style en ligne) couvre la page pendant l'analyse des scripts ; il est retiré 250 ms après `load`, une fois la rangée des vignettes posée (filet à 10 s). Le menu apparaît d'un coup.
- Les deux bonus de l'accueil (`#spl_peta`, `#spl_tab`) sont des autocollants : pas de cadre de bouton, liseré blanc (`drop-shadow`), inclinés, étiquette sombre.
- Générique : trois cœurs rouges (`HSAICO.coeur2`) à la place de « Je vous aime fort ».
- Tableau : onglet Photos rangé en Affiches / Photos / Portraits ; portrait du personnage du joueur (`d.chef`, clé `chef`, ligne 18 de `IMA`, affiché si `CH.chef`). Choix et dispositions enregistrés dans `localStorage` (`hsa-tab-v1`, `tabSave()` à chaque rendu). Ouvert depuis l'accueil (`window.__shBack`), fermer recharge la page pour revenir à l'accueil.
- Mode du doigt : `cur.pan` (bouton `.shmode`, icônes `fleche` / `main` dessinées à la main dans `SHI`) ; en mode main, toucher ne saisit plus les éléments, un doigt déplace le tableau zoomé.

Accueil (v727) :
- Transition : un clic sur un bouton de `#splash .sbox` est intercepté (écoute en capture sur `document`), le damier `#spltr` se referme, le clic est rejoué (`window.__splTr`), puis le damier se résorbe. Pas de transition pour la confirmation de « Nouvelle partie » ni pour le tableau sans partie enregistrée.
- `#splmail` et `#splhint` sont masqués (le second réapparaît avec la classe `msg` pour le message du tableau sans partie) ; l'adresse de contact est dans « À propos ».
- Étiquettes des autocollants : lettres blanches cernées de sombre, sans fond. Icônes `fleche` et `main` du tableau fournies par l'utilisateur.

Musique du tableau souvenir (v728) :
- `musique/tidy_clinic.mp3` (« Tidy Clinic », créée avec Suno, créditée dans les Crédits ; ajoutée à la liste `MUS` de `outils/mksw.py`). `shMus(true)` à l'ouverture du tableau : la musique du jeu s'efface et se met en pause, celle du tableau monte ; `shMus(false)` à la fermeture fait l'inverse. Fondus par `requestAnimationFrame` (`shFade`), car le jeu est en pause. `playMus` ne fait rien tant que `#shov` est ouvert ou que le tableau vient de l'accueil (`__shBack`).

Captures et vidéo de présentation (12 novembre 2026) :
- `screenshots/` : huit captures paysage 1920 × 1080 (`01_titre` … `08_quartier`) et huit portrait 1080 × 1920 (`p01_…`), légendées dans l'image (titre Lilita, sous-titre Atkinson, bandeau sombre en bas) ; elles sont listées dans `manifest.webmanifest` (`wide` / `narrow`). Les originaux sans réduction de couleurs sont remis à l'utilisateur pour Google Play.
- Méthode : la légende est un calque posé dans la page du jeu avant la capture (polices du jeu). Raccourcis utiles : `?an=3`, `?an=3#tableau`, `debOpen()`, `petaShow(true)` avec `__pTerOK=()=>true`.
- Vidéo : enregistrée image par image avec l'horloge simulée de la partie témoin (`__adv(1000/30)` puis capture), animations CSS recalées sur le temps simulé (`document.getAnimations()`), assemblée par ffmpeg à 30 images par seconde. C'est le seul moyen d'avoir une vidéo fluide sur le banc d'essai.

Modes de jeu, conseil du quartier, musiques allégées (v729) :
- Trois modes : découverte (`window.EASY`, `setEasy`, `hsaEasy`), normal, difficile (`HARD`). Découverte : la ville et l'ARS paient 20 % de plus (`payARS`, `leave`), la tranquillité baisse 30 % moins vite (`W('upd')`). Les deux cases sont dans les Paramètres et s'excluent.
- Au lancement d'une nouvelle partie, `newGameAsk` ouvre `#modesel` (trois boutons `data-m="n|e|h"`, en colonnes en paysage via la feuille paysage) avant l'introduction. Les robots (`partie-temoin.js`, `frise-messages.js`) choisissent « normal » : tout nouvel écran avant le début de partie doit leur être appris, sinon ils restent bloqués.
- Conseil `ctip('q20y'+YR, …)` quand la tranquillité passe sous 20 en année 2 ou 3 (une fois par an, `B.qTip`). Le bilan mensuel donne déjà les raisons des refus (`DGN.u`, `dgAdvice`).
- Musiques : `petanque_m`, `petanque_choix_m`, `reunions_m`, `tidy_clinic_m` en mono 64 kbit/s (noms neufs pour le cache durable) ; les saisons étaient déjà en mono 48 kbit/s. Dossier `musique/` : 16 Mo → 11 Mo.
- Frise du 12 novembre : 4,4 messages par minute après l'ouverture (objectif ≤ 5).

Lyrica (v730) :
- Premier chapitre de Samba (« Lyrica quand il en trouve ») et de Jawad (« prend du Lyrica acheté dans la rue »). Le mot est dans le glossaire des termes soulignés (`GLOSS.Lyrica`, script v465 ; la bulle dit « automédication (usage pirate) » liée aux parcours d'exil, formulation voulue par l'utilisateur, sans le mot « détourné ») : il suffit d'ajouter une clé à la table `G` pour qu'un mot soit souligné et expliqué dans les fenêtres.


Colonne repliable en paysage (v733) :
- En paysage (hauteur ≤ 600 px), la colonne de gauche est repliée par défaut : `body.hudc` (règles dans la feuille paysage, bloc ≤ 600 px). Repliée : argent et personnes accueillies en chiffres seuls, jauges de `#spw` en anneaux sur deux colonnes (`conic-gradient` avec `--v` = valeur et `--c` = couleur, posées sur chaque `.r` par la correction `__uiv` du script v733 ; `.low` sous 25 %). `--zl` est réduite pour ce qui se place à droite de la colonne.
- Un toucher sur la colonne repliée la déplie (clic intercepté en capture, `body.hudo`) ; un toucher ailleurs la replie. L'épingle `#hudpin` (à droite de la colonne dépliée) la garde ouverte : `localStorage` `hsa-hudpin`. Pendant le guide (`body.gdon`), la colonne reste dépliée.
- Une jauge a deux `<i>` : `.gh` (fantôme de l'animation) et la vraie ; lire `.bar > i:not(.gh)`. Les lignes argent / accueillis gardent 28 px de haut (cible du doigt, contrôle « petit » de `test-ecrans.js`).

Combo, boutons du haut, caisse de solidarité (v734-v735) :
- Paysage : la pastille des effets en cours (`#rdfx`) se place à côté de la colonne dès que celle-ci est repliée (`body.hudc`) ou qu'elle toucherait le bouton Quiz, et toujours à droite du combo (`#cbh`) ; son déplacement n'est plus « collant » (`dataset.moved` recalculé à chaque passe). Les trois boutons du haut à droite font 40 px, séparés de 7 px (bloc ≤ 600 px de la feuille paysage).
- `nextYear` reçoit toujours 1, pas le numéro de l'année : tester `YR` après l'appel. Le soutien de la mairie (200 €, vote du conseil gagné) n'était de ce fait jamais versé ; il l'est maintenant une fois (`B.cqPaid`).
- Caisse de solidarité au début de l'année 3 (`B.caisse`, recette « Caisse de solidarité ») : deux moitiés, la grève de l'année 2 (`B.strikeD`, « des collègues de toute la France ») et le vote du conseil de quartier gagné (`B.cqWin`, collectif Je dis oui HSA). Total 1 500 € en normal, 2 000 € en découverte, 1 000 € en difficile ; rien si ni l'un ni l'autre. Annoncée dans le bandeau de début d'année (`#ev`), une bulle et le journal, sans fenêtre. La Fédération Addiction n'est pas citée (choix de l'utilisateur).
- `W(...)` n'est visible que dans le script principal : une couche sur une fonction du jeu s'écrit là, pas dans un `<script>` à part. `ctip` peut ignorer un conseil (35 s après le précédent) et le retient d'une partie à l'autre : ne pas s'en servir pour une information propre à la partie.

Grève au choix (v736) :
- La scène « Ras-le-bol » (`strikeStart`, dernière définition) a deux boutons : « Fermer la halte et manifester » (inchangé) et « Rester ouvert » (`B.strikeNo=1`, énergie −20 pour toute l'équipe, pas de fermeture, pas de suite). La moitié « grève » de la caisse de solidarité n'est versée que si `B.strikeD && !B.strikeNo`. Les robots prennent le premier bouton (la grève).

Musique du tableau depuis l'accueil (v737) :
- La couche `W('playMus')` de la v728 n'était jamais posée (`W` n'existe pas dans le script du tableau, erreur avalée par `try`) : la musique de la saison partait 700 ms après `startGame`, juste avant celle du tableau. Le blocage est maintenant posé directement sur `window.playMus`. Pour vérifier : compter les appels à `HTMLMediaElement.prototype.play` (un seul, `tidy_clinic_m.mp3`).

Tableau souvenir : éléments bloqués, glisser fluide, compteurs (v738) :
- Les clés `sign`, `st0`, `st1` commencent par « s » et étaient prises pour des autocollants (`s<rang>`) : impossibles à déplacer. Tester un autocollant avec `isStk(k)` (`/^s\d+$/`), jamais avec `k[0]==='s'`.
- Glisser : rien n'est dessiné au toucher. Au premier mouvement (> 3 px), le tableau sans l'élément est peint une fois dans `.shpv` et l'élément seul, recadré, devient un calque `canvas.shdr` dans `.shvp` (position relative), déplacé par `transform` : aucun dessin pendant le glisser. Au lâcher, composition rapide puis `render()` 40 ms plus tard. Un canevas ajouté à la page hérite d'une bordure de 3 px d'une règle générale du jeu : la remettre à zéro en ligne.
- `CN` (dont `CN.t`, dépistages), `SYP` (seringues ramassées) et `LS` (vies sauvées) repartent de zéro à chaque année (`nextYear`). Les totaux de la partie sont `B.totT`, `B.totS`, `B.totL` (cumulés juste avant le passage d'année) + la valeur de l'année en cours ; le tableau et la boule DASRI s'en servent. Les années déjà passées d'une partie commencée avant la v738 sont perdues.
- Un post-it facultatif qui vaut 0 n'est plus proposé. Les câlins au chien (`B.dogk`) ne comptent que les usager·es qui s'arrêtent devant le chien, environ un par minute de jeu.

Tableau souvenir : taille de tous les éléments, hasard, caresses (v739) :
- `LAYS[format]` porte aussi `k` (taille par clé, 0,5 à 2,2) et `r` (inclinaison ajoutée) pour les éléments épinglés ; `item` les applique (`g.scale`), la zone touchable suit. Tout élément touché devient `cur.sel` (`selObj` rend `{t:'i',k}` pour un élément épinglé) : la barre `.shsel` règle sa taille ; plan et suppression restent réservés aux autocollants et aux textes.
- Options (« … ») : « Disposition au hasard » (`.shrnd` : décalage, taille, inclinaison et ordre tirés au sort, autocollants redistribués) et « Tout réinitialiser » (`.shrst`).
- Toucher le chien sur le plan compte un câlin (`B.dogk`) et fait monter un cœur ; le chien est dessiné aux coordonnées locales `DOG.x`, `DOG.y` (comme les crottes), pas à celles de `DOGP`.

Tableau souvenir : barre en bas en portrait (v740) :
- En portrait (`@media (orientation:portrait)` dans la feuille du tableau), `.shrail` est une barre horizontale en bas (58 px + marge de sécurité), boutons de `min(46px, (100vw − 38px) / 9)` ; l'aperçu prend la largeur (369 × 651 sur 375 × 812, au lieu de 304 × 537). Tiroir, options, zoom plein écran et barre de l'élément choisi (`selBar`) tiennent compte de la barre. En paysage, rien ne change (colonne à droite, feuille paysage).
- Un nouvel autocollant se pose au centre de la zone visible (du tableau, ou de la partie zoomée), décalé d'un autocollant à l'autre.
- L'image porte « hsa-lejeu.github.io » en bas, dans le cadre. Le bouton du hasard s'appelle « Mélanger ».
- « Cartes gagnées » lit l'album (`COL`, `localStorage` `hsa-cards-v1`), commun à toutes les parties : sur un navigateur neuf avec la partie de test `?an=3`, il vaut 0 puis monte d'un coup quand `cardTick` tourne.

Écrans de chargement (v741) :
- `#boot` et le voile du tableau (`#shwait`) montrent le chien de la halte qui trottine (feuille `IMD` recopiée en data-URL dans `<style id="ldst">`, variable `--ldog`), des traces de pattes qui apparaissent derrière lui (`.ldp`, masque SVG `--lpaw`) et une phrase courte (`window.__ldFact()`, liste `F` du petit script placé juste après `#boot`). `window.__ldHTML(titre)` rend le même bloc pour un autre écran d'attente.
- La phrase avance d'un cran à chaque lancement (`localStorage` `hsa-ldi`), sans `Math.random()` : un tirage au chargement décalerait le hasard de la partie témoin.
- Sources des chiffres (novembre 2026) : Allemagne 33 salles en 2024 (ministère fédéral de la Santé), Suisse 15 salles dans 11 villes (Infodrog, janvier 2025), 350 000 personnes sans domicile (Fondation pour le logement, rapport 2026), cocaïne 1,1 million d'usagers dans l'année (OFDT), Marseille bloquée en 2024 puis en 2025 ; les autres phrases reprennent les cartes et le quiz du jeu. À revoir quand ces chiffres changent.
- Traces de pattes (v742) : image fournie par l'utilisateur, réduite à sa grille (33 × 36) et recolorée en brun (`--lpaw`, data-URL PNG en fond, plus de masque) ; les doigts pointent vers la droite, dans le sens de la marche.

Autocollants à gagner (v743) :
- Table `SKC` (script du tableau) : `id → [indice, condition]`. Quatre autocollants sont libres (sourire, étoile, soleil, cœur rouge) ; les autres se gagnent en jeu : seringue (10 ramassées), naloxone (une vie sauvée), médicaments (salle de soins), poing levé (grève faite), arc-en-ciel (année 2 atteinte), chien (mascotte), cœurs vert / jaune (tranquillité 70 / satisfaction 80, après 20 personnes accueillies), violet (maison des femmes), bleu (10 collègues), rubans et « Support. Don't punish. » (participation au rendez-vous, `B.rdvN`), médaille (tournoi gagné), HSA prolongée / Droit commun (fin `mid` / `good`), #jedisOUI (le collectif se forme dans la partie : `B.jdoC`, posé par l'étape `col` de `NL3`), Bonne Mère (30 cartes), camion (acheté).
- Gagné pour toujours : `localStorage` `hsa-stk-v1` (effacé par « Tout effacer », qui retire toutes les clés `hsa…`) ; `stkUnl()` fait le point toutes les 4 s en jeu et à l'ouverture du tableau, sans aucune annonce, et met à jour `hsa-tab-unl` (pastille de l'accueil). Pas de rattrapage pour les parties d'avant la v743 (le jeu n'est pas sorti).
- Dans la liste, un autocollant pas encore gagné est une silhouette (`button.lock`) ; le toucher affiche l'indice dans `.shmsg`. Dans le script du tableau, `st` et `q` sont des variables locales : ne pas y lire les variables du jeu du même nom.

Scènes garnies (v744) :
- `window.__deco(H, T, scène)` (script v744) ajoute le décor des scènes jugées vides, juste après leur fond : `park` (scène `LCD.park` des parcours : repos au square, banc, chantier de Jess — allée, fontaine, lampadaire, second arbre, banc, fleurs, deux passants), `chi` (chantier d'insertion : arbres, barrière, rubalise, sacs), `chn` (coin des chiens : arbres, lampadaire, clôture, banc), `cdq` (conseil de quartier : fenêtres, horloge, public sur deux rangs), `c111` (salle d'attente : accueil, fenêtre, sièges, table basse). Pour garnir une autre scène : ajouter un cas à `__deco` et l'appeler après le fond de la scène.
- Les scènes de projets ont deux définitions : l'ancienne (`PRJS3`, `PRJS5`) et la version active qui commence par `A30.grass(H)`. C'est la seconde qui s'affiche.
- Outil de contrôle (hors dépôt) : rendre `PRJS[k]`, `LCD[k]` et `cxImg(i)` dans un canevas 200 × 104 avec `mkH(g)`.

Bande-annonce v4 (12 novembre 2026) :
- 36 s, sur le modèle de la v2 : titres sur deux lignes dont les mots surgissent un à un, barre arc-en-ciel, bandes diagonales bleu / vert / jaune / orange entre les plans, musique de la v2. Quatre plans du jeu principal (construire, accueillir, suivre, maraude), puis une seule section « Fais preuve de polyvalence pour convaincre ! » (débat avec `debObjection()`, pétanque avec un vrai lancer : choisir « Pointe » puis tirer vers l'arrière sur le terrain, tableau souvenir), puis la fin.
- En temps simulé, une fenêtre ouverte par le code attend dans la file `AG` : l'ouvrir avec `AG.rel=1` autour de l'appel (`lcMenu`, `tourOpen`).

Éléments peints, deuxième série (v745) :
- 31 nouveaux sprites ajoutés sous la feuille `IAS` (980 px de large désormais) et à `IAPM` : festival (`fs_stage`, `fs_spk`, `fs_dj`, repris par `fsH` à la place de `FSM`), `fanions` (stand du festival), `ban_w` (banderole de la manif, texte rouge écrit par le jeu), `pk1`…`pk4` (cartons des pancartes de `mSign`, étirés à la taille du texte), `art1`…`art4` (`frameArt`), `pboard` (`fpa`), `gkey` (`A30.key`), `mag2` (couverture du magazine, sans portrait incrusté), `lect` (pupitre de `lec`), `warn2` (`alr`), `auto2` (automate, plan et fenêtre), `fl_s` / `fl_m` / `fl_l` (flaques : `c59`, `floodScene`), `doc2` (`c93`), `ban_g` / `ban_b` (bannière de `c51` ; la bleue n'est pas encore utilisée), `door2` (`c111`), `env_c` / `env_o` (`envDraw` : fermée jusqu'à mi-ouverture, puis ouverte avec la lettre qui monte derrière le bord avant), `roof_boul`, `roof_shops`, `amb_in`.
- Sur le plan, la taille donnée à l'IA est en pixels du canevas (2 × les unités du monde) : `iaP` dessine à moitié taille. Toit de la boulangerie (`iaRoof`, appelé par `ob` pour `shop1`) et entrée des ambulances (`iaAmb`, dans la couche `W('ob')` de l'hôpital) : l'ancien dessin est d'abord recouvert par un morceau du sol (`iaPatch`, recopié de `ground(seas())`), puis l'image est posée ; rien de tout cela pendant l'épilogue (`__HDON`). Boulangerie partenaire : le toit est découpé au rectangle de la salle. Toit des boutiques à louer : dans `lvDraw`.
- L'ancien dessin reste en repli partout si la feuille n'est pas chargée. Outil de découpe (hors dépôt) : `mkel.py` (composantes par transparence, réduction en couleurs prémultipliées, tailles exactes dans `EX`).
- La partie témoin `debut` donne parfois « DIFFÉRENTES » entre deux copies identiques (une fois sur trois ou quatre) : relancer avant de conclure.

Retouches des éléments peints (v746) :
- Retirés à la demande de l'utilisateur (jugés ratés) : toit de la boulangerie, toit des boutiques à louer, entrée des ambulances (`iaRoof`, `iaAmb`, `iaPatch` n'existent plus), panneau attention `warn2` (l'ancien `H.F('warn')` est revenu), guirlande `fanions`. Leurs cases sont vides sur la feuille. Ne pas retenter de recouvrir un bâtiment du plan par une image posée dessus.
- `potsRec(H, f)` : exécute `f` (en général `H.room(...)`), note les meubles posés tout en bas par le décor (plantes des coins) et rend une fonction qui les redessine ; à appeler après l'eau (`floodScene`, carte `c59`) pour que les flaques passent derrière les pots.
- Pancartes de `mSign` : le carton est taillé plus large que le texte (texte ≤ 80 % de la largeur, 60 % de la hauteur) et le texte est centré. Texte de la banderole et de « MOIS SANS TABAC » au milieu de la toile.

Huit scènes redécorées (v747) :
- `window.SC8` (script principal, juste avant `dfMonth`) : `sen`, `sub`, `parl`, `hep`, `bo` (fenêtre « Défi ! » : `dfStart` appelle `SC8[k]` s'il existe, sinon l'ancienne salle à quatre personnes ; la cible 🎯 passe en haut à droite), `ref(H,T,ci)` (« … dit non »), `mdph(H,T,ci,wc)` (le fond est posé par `scn`, `wc` dessine Agnès), `tract` (boîtes aux lettres dans la rue). Pour donner un décor à un autre défi : ajouter une fonction du nom de sa clé dans `DF`.
- Poses des personnages (`H.spr(ci, col, X, YB)`) : 24 de face, 30 tourné vers la gauche, 36 vers la droite, 42 de dos ; 0 à 23 = marche. `H.room` ajoute seule fenêtre, affiche, radiateur, étagère et plantes des coins : garder le centre (x 30 à 170) pour le décor propre à la scène.

Éléments peints, troisième série (v748) :
- 17 sprites de plus sous la feuille `IAS`, dans `IAPM` : `crib2` (berceau avec mobile : naissance, carte `c57`), `bl_r` / `bl_b` / `bl_y` / `bl_g` (ballons : `EVd` les prend à la place de `bal_*` partout), `camp` / `camp_s` (bandeau de campagne de Crotti, texte écrit par le jeu), `mt_table`, `mt_screen`, `mt_cork`, `mt_cooler`, `mt_coat` (salle de réunion : `SC8.gen`, décor de tout défi sans scène propre ; la cible 🎯 a disparu de la fenêtre « Défi ! »), `bub0` / `bub_d` / `bub_q` (bulles), `easel2` (chevalet de l'hommage, le visage est dessiné dans le cadre, découpé sous le ruban noir), `phone2` (téléphone verrouillé, carte `c110`).
- `iaBub(g, x, y, largeur, hauteur, pointe)` dessine une bulle de taille libre à partir de `bub0` (coins 4 × 4, bords étirés, pointe posée à l'abscisse donnée) ; `A30.bub` s'en sert. Pour une bulle « … » toute faite : `iaG(g,'bub_d',X,Y)` (23 × 20).
- Outil de découpe (hors dépôt) : `mk31.py` (composantes par étiquetage après dilatation, pour les planches à plusieurs objets sur deux rangées).

Massage cardiaque (v749) : dans `PRJS.psc`, la personne est allongée sur un tapis de sol plat (rectangle bleu), plus sur le tapis rond `rug_b`, qu'on prenait pour une table. Une personne allongée (`A30.lying`) se pose sur un tapis plat ou un lit, jamais sur un meuble rond.

Scènes des parcours garnies (v750) :
- `LCD.room` ajoute seul un tapis sous les personnes, un meuble à fleurs et une lampe à gauche (si la gauche est libre), une étagère ou un classeur à droite, et un bureau quand la scène ne donne aucun meuble. `LCD.studio` est un vrai petit logement (coin cuisine, frigo, table, lit, table de nuit, lampe).
- Collectif (`PRJS.col`) : les pancartes sont les cartons `pk1`…`pk4` avec un cœur rouge.
- Partie témoin `debut` : la variante instable donne « 68 événements, arrivée A1 M3 J10 » d'un côté ; si c'est le cas, relancer.

Images de la quatrième série et scènes garnies (v751) :
- Sprites ajoutés à `IAPM` : `bed2` (lit vu de côté : `LCD.hosp`, `LCD.lhss`, `LCD.iso`, appel « soins », chambre du 115), `phone_f` (téléphone fixe sur le bureau de `phoneScene`), `boxes` / `suitc` (emménagement d'Agnès ; la valise suit la personne qui quitte l'équipe), `yoga` (tapis violet, `yM(H, n, x0, pas, pied)` pose un tapis sous chaque personne des scènes de la formation yoga ; l'émoji 🧘 ne sert plus que de repli), `chest` (coffre vide de la trésorerie à sec), `troph` (défi réussi, à la place de l'émoji 🏆), `medal` (pas encore utilisée), `guichet` (commissariat : l'agent est dessiné dans la vitre, découpé, sous un voile bleu clair), `pol1`…`pol4` (cadres polaroid de `polaroid()` : fenêtre de 22 × 22 à (X+1, Y+1), la photo est décalée de 2 px vers la gauche).
- Scènes garnies avec le pack : sortie de prison, visite d'un·e ancien·ne (ballons), prime de Santé publique France, l'équipe se réunit / augmenter les salaires (liège, fontaine), communiqué du gouvernement (télé), la halte rouvre, « … demande le test », MDPH reconnue, 115, dortoir, trésorerie.

Retours sur les scènes (v752) :
- Cœurs des scènes : `heartPx` dessine l'image `HSAICO.coeur2` (ou `HSAICO.coeur`, vert, pour une couleur verte) en 9 × 8 ; l'ancien dessin reste en repli.
- Prison (`LCD.jail`) : cellule grise vue à travers des barreaux au premier plan (lit `bed2`, toilettes, fenêtre grillagée), sans plantes ni fenêtre (`H.F` neutralisé pendant `H.room`).
- Un personnage derrière un bureau ou une table se dessine AVANT le meuble ; sinon il a l'air debout dessus. Contrôle automatique : `node outils/pieds-sur-meubles.js URL [planche.png]` rejoue projets, parcours, cartes, défis et les scènes des fenêtres lues dans le code, et signale les pieds posés dans un meuble dessiné avant (objectif : 0). À lancer après tout ajout ou déplacement de meuble ou de personnage dans une scène.
- La ministre en visite : les arguments de `H.spr` étaient dans le désordre (elle n'apparaissait pas).

Bruitages (v753) :
- Couche commune posée juste avant `sfxLoad` (script principal) : au plus un son « non geste » toutes les 0,8 s (le suivant est abandonné, sauf `alarm` et `fanfare`) ; `coin` au plus une fois toutes les 3 s, une des quatre pièces `kn/coin_1`…`4` à tour de rôle, hauteur 0,92 à 1,08 ; `bad`, `sad`, `joy`, `good` : hauteur 0,9 à 1,1 (`window.__sfxR`, lu par `sfxS`). Les variations viennent d'un compteur qui tourne, jamais de `Math.random()` (partie témoin). Les gestes (`click`, `page`, `stk_*`, `pet`) ne sont ni comptés ni retenus.
- Pour mesurer : `window.__SFXLOG=[]` dans la console ; chaque appel y est noté `[secondes, son, 1 | 'muet' | '<0,8s' | 'coin<3s']`.
- Volumes : `hire`, `alarm`, `alert` × 0,6 ; `syringe` × 2,5 (dans `SMAP`).
- Nouveaux sons (fichiers Kenney CC0 fournis, `SDAT` préfixe `kn/`) : `stk_pose` (autocollant ajouté), `stk_lache` (élément lâché), `stk_melange` (Mélanger), `stk_photo` (Télécharger, Partager), `piqure` (`W('accident')`, bandeau « … s'est piqué·e »), `colere` (`W('sad')`, « … est en colère et s'en va »). `pet` (caresse au chien) réutilise `steel/09` plus aigu.
- Toute scène (`popNext`, `chgShow`) joue un son à l'ouverture : `o.snd`, sinon `alert` si le titre parle de surdose, piqûre, SAMU ou urgence, sinon `open`.
- Débat : `dsfx('crowd')` (absent de `DSFX`) remplacé par `sfx('fanfare')`.

Meeting de Crotti (v754) : estrade `estrade` (60 × 21, avec son pupitre) et haut-parleurs sur pied `hp` (12 × 36) dans `IAPM`, scène `debStart`. Crotti (`valSpr`) monte sur l'estrade (pieds à 78) et le pupitre seul (`pupit`, découpé de l'estrade) est redessiné devant lui.

Aboiement et foule (v755) : sons fournis par l'utilisateur, convertis en MP3 mono 64 kbit/s dans `SDAT` (`kn/aboie`, `kn/foule`, gains 0,3 et 0,32 : ils sont plus forts que les autres). `pet` (caresse au chien) = aboiement ; `foule` remplace la fanfare à la fin du débat et passe toujours, comme `alarm` et `fanfare`. Public du meeting de Crotti : six personnes à gauche, sur deux rangs, pieds au-dessus du bord.

Caméras et meeting (v756) :
- Les caméras de tournage (`cam` de `EVM`, `cam1`/`cam2` de `DEBM`) ont l'objectif à GAUCHE dans le dessin d'origine : on ne les retourne que pour filmer vers la droite, et l'opérateur·rice se tient du côté opposé à l'objectif. Corrigé : meeting, tribune du CIQ, « caméra au poing », caméra du débat, conférence de presse (`presCams`).
- Meeting : estrade remontée (y 58), Crotti pieds à 65, public de sept personnes de dos DEVANT l'estrade, dessiné après Crotti et le pupitre (`PUB()`). Dans une scène de rue, la hauteur des pieds est resserrée (`__sy`) : une valeur au-delà de 104 descend encore un peu.
- Pétanque : ses sons passent par `psfx`, `dsfx` et `sb`, pas par `sfx` : le plafond de la v753 ne s'y applique pas.
- Tribune du CIQ (v757) : le micro sur pied moderne (`mic` de `DEBM`), pris pour une caméra moderne, est retiré.

Pétanque, hauteur des sons (v758) : `sb('rpg/chop', …)` (chocs et atterrissages de boule) et `dsfx('obj', …)` du choix de coup varient de ± 8 % (`PVR()`, compteur qui tourne, pas de `Math.random`). Mesure de la pétanque (robot, 2 × 8 min, `psnd.js` hors dépôt) : ~30 sons par minute, 6 à 8 par lancer, jamais plus de 4 en 0,8 s : pas de plafond nécessaire. Pas d'ambiance pendant la visée (choix de l'utilisateur).

Tableau souvenir, chargement et entrée de l'accueil (v759) :
- Message flottant du tableau (`msg`, dont les indices des autocollants à gagner) : posé juste au-dessus du tiroir ouvert, sinon juste au-dessus de la barre du bas (position calculée à chaque message).
- Slogan : coupure choisie par la table `brk_` dans `draw` (nombre de mots sur la première ligne) ; « c'est à Marseille bébé » tient sur la ligne du bas.
- Carte postale de l'espace (`pc`) : seulement si `B.debDone && B.deb>=3` (victoire totale, Crotti en orbite) : `d.pc`. Les portraits marqués « Perdu·e de vue » sont voulus : suivi jamais proposé (`!S.on`) ou personne perdue (`S.lost`).
- Le bouton Fermer (`.shx`) est le dernier de la barre. Options : « Mélanger les places » (`shuf`) et « Tableau surprise » (`.shsur` : slogan, quatre post-it, photos masquées au hasard, 3 à 7 autocollants parmi ceux gagnés, puis `shuf`).
- Polices déjà dans la page, sans poids de plus : `Lilita`, `Main` (manuscrite), `Amat`, `Cavt`, `LoraI` (italique à empattements), `PMark` (marqueur), Atkinson.
- Écran de chargement : le chien avance et change d'image par `transform` seulement (`.ldr` translate, bande `.lds` de quatre images en `steps(4)`), animations tenues par le compositeur même quand la page lit ses scripts. Ne pas y animer `left`, `background-position` ni rien qui demande une mise en page.
- `body.booting` (posée par le petit script de `#boot`) met en pause toutes les animations de `#splash` ; à la fin du chargement, la classe est retirée, `LG0` est remis à l'heure, `#boot` s'efface en 0,45 s : le titre entre mot à mot puis les boutons, comme au tout premier affichage.

Tableau souvenir : format carré, polices, slogan au choix (v760) :
- Trois formats : `cur.land` vaut `false` (portrait 1080 × 1920), `true` (paysage 1920 × 1080) ou `'c'` (carré 1440 × 1440, disposition `C_` dans `draw`). Ne plus écrire `cur.land?…:…` pour une taille ou une clé : `FW(f)`, `FH(f)`, `FK(f)` (`'p'`, `'l'`, `'c'`, clés de `LAYS` et de `BGC`). Dans `draw`, `LAND` est faux en carré et `SQ` vrai.
- Polices : table `FNT` (`[famille, 'bold ' | 'italic ' | '']` : Lilita, Main, Amat, Cavt, LoraI, PMark, Atkinson). Un texte libre porte `f` (rang dans `FNT`) ; la police du prochain texte est `cur.fnt`. Les polices sont chargées par `document.fonts.load` à l'ouverture, puis le tableau est redessiné.
- Slogan : couleur `CH.sc` et police `CH.sf`. Les pastilles de couleur et les boutons « Aa » du tiroir Texte s'appliquent au slogan quand il est choisi (`cur.sel==='sign'` : touché sur le tableau, ou flèches du slogan), au texte libre choisi, sinon au prochain texte ; l'étiquette `.shtl` dit lequel. `render()` rappelle `ov._tx` (= `txtShow`) quand le tiroir Texte est ouvert.

Cadres de saison du tableau souvenir (v761) :
- `CH.fr` : 0 aucun, 1 hiver, 2 printemps (mimosa et coquelicots, pas de cerisier : choix de l'utilisateur), 4 été (olivier, citrons, lavande), 5 automne ; le 3 (bougainvillier) a été retiré à la demande de l'utilisateur (v762), sa case est vide sur la feuille et un choix 3 enregistré devient 4. Rangée `.shfr` dans les options ; « Tableau surprise » en tire un au hasard.
- Images de l'IA fournies par l'utilisateur (une bande répétable et un coin haut-gauche par saison, fond magenta), réduites à leur grille et à 20 couleurs par `mkcad.py` (hors dépôt), posées sous la feuille `IAS` : `cd<k>s` (bande) et `cd<k>c` (coin) dans `IAPM`. L'hiver n'a pas de bande (guirlande jugée moche) : deux coins en haut seulement.
- Dessin dans `draw`, après le fond et avant les éléments épinglés, à l'échelle 3 : bandes sur les quatre côtés (tournées, le haut vers l'extérieur), morceaux à leur taille, jamais étirés, le dernier coupé sous le coin ; coins retournés aux quatre angles. L'adresse du site est cernée de sombre quand un cadre est choisi.

Retours sur l'année 3 (v763) :
- Visite d'un·e ancien·ne (`suVisit`) : la fenêtre « Une visite ! » ne s'ouvre qu'à la première. Ensuite : bulle de Camille, et un gâteau posé vingt jours (`B.cake=[salle, GT de fin]`, couche `W('roomFurn')`) sur la table de la salle de repos, ou sur le comptoir de l'accueil si elle n'existe pas. Jamais dans la cuisine (choix de l'utilisateur). Dans `roomFurn`, `wdl()` ne marche pas : dessiner directement, après les meubles.
- Le meuble `rug_b` est une table ronde bleue (pas un tapis). Les objets achetés gardent la place choisie par le joueur (`B.ipos`) ; dans la partie de test de l'année 2, les fleurs étaient enregistrées sur cette table.
- « Unité mobile » remplace partout « camion de maraude » (panneau `ens('UNITÉ MOBILE',386,…)` à droite du camion, bouton, aide, carte, messages, autocollant, et la règle `M134` du tri des bulles).
- Une seule baisse de subvention en année 3 : le défi `sub` reste ; `bud` (« Coupe budgétaire », choix d'une salle à fermer) a `at:9999` et ne se déclenche plus.
- Dortoir : `bedX(k)` place les trois lits à 3, 13 et 37 quand la porte est en haut (salle de 56 de large), pour qu'aucun ne tombe devant la porte : le lit du milieu n'était dessiné que par `sleepDraw`, par-dessus les collègues. La couverture redessinée par `sleepDraw` ne couvre plus que 3,5 px.
- Panneaux : `batir`, `urg` et `hopital` désaturés de 30 % sur la feuille `IAS` (les autres enseignes ne sont pas touchées). Panneau du stade : image `stade` sur un poteau en bois, au-dessus du coin en haut à gauche du terrain (234, 276), hors du terrain.
- Maison de quartier fermée (`cp_>=.5` dans la couche `W('world')` des bâtiments partenaires) : le panneau est dessiné sur le bord du toit (148, 357), plus au pied du bâtiment.
- Outils : la partie témoin `an3` n'est plus reproductible au-delà de ~440 s (un appel sans réponse) ; son robot clique sur le premier bouton visible quand le jeu est en pause sans fenêtre (c'est lui qui ouvrait le dossier d'une personne suivie). La frise des messages se mesure machine au repos : 7,1 messages par minute mesurés pendant d'autres calculs, 3,4 au calme.
- Capture « tout construit » (hors dépôt, `all.js`) : partie `?an=3`, puis `buyExt('lv')`, `buyVan()`, `buy(i)` pour chaque objet, `lotChoose('stade')`, `B.unl.ax=1;buyExt('ax')`, `buyG()`, `prjDo` des projets, `B.maiOk=1` ; `window.__noCull=1` pour dessiner tout le plan.
