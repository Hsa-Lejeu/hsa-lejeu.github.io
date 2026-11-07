# Instructions pour Claude

Avant d'ajouter, de modifier, de déplacer ou de supprimer un message affiché au joueur (fenêtre, scène, conseil de Camille, bulle, alerte, « Nouveau ! », toast), lire `RYTHME.md` et respecter ses règles. Après un tel changement, mesurer avec `outils/frise-messages.js` (règle 9).

Mise en page en paysage : depuis la v585, toutes les règles `@media (orientation: landscape)` sont dans une seule feuille, `<style id="paysage">`, rangée par condition puis par zone de l'écran. Ne pas ajouter de bloc paysage ailleurs : écrire la règle dans cette feuille. Après tout changement de mise en page (portrait ou paysage), lancer `node outils/test-ecrans.js` (objectif : 0 caché, 0 dehors, 0 déborde, 0 vide).
