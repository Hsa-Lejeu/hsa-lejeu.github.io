# Retirer les déclarations CSS mortes « par preuve »

Le jeu compte environ 3 660 règles CSS réparties dans 265 feuilles, dont beaucoup se contredisent
(`#spw .r{…}` puis, plus loin, `#app #hud #spw .r{…!important}`). Ces outils retirent les
déclarations qui ne peuvent jamais s'appliquer, sans rien changer à l'affichage.

Une déclaration est retirée seulement si une autre déclaration :
- vise exactement les mêmes éléments (même sélecteur, une fois retirés les ancêtres toujours vrais
  comme `html body #app #hud` devant `#spw`) et sous les mêmes conditions (`@media`) ;
- porte sur la même propriété ;
- gagne toujours (`!important`, puis précision du sélecteur, puis ordre dans la page) ;
- est dans une feuille présente dès l'écran d'accueil, et a une valeur comprise de tous les navigateurs.

Les propriétés à préfixe (`-webkit-…`) et quelques propriétés sensibles sur iPhone ne sont jamais retirées.

## Utilisation

    python3 -m http.server 8765 &
    node outils/css-mort/1-releve.js http://localhost:8765/index.html /tmp/releve.json
    node outils/css-mort/2-preuve.js /tmp/releve.json /tmp/plan.json
    node outils/css-mort/3-retrait.js /tmp/plan.json /tmp/releve.json index.html nouveau.html
    # servir nouveau.html, puis vérifier que rien d'autre n'a changé :
    node outils/css-mort/1-releve.js http://localhost:8765/nouveau.html /tmp/releve2.json
    node outils/css-mort/4-verif.js /tmp/releve.json /tmp/releve2.json /tmp/plan.json    # objectif : 0 anomalie

Ensuite, comme pour tout nettoyage : `outils/partie-temoin.js` (trois départs) et `outils/test-ecrans.js`.
