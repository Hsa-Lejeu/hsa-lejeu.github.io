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

