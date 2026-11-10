# Instructions pour Claude

Avant d'ajouter, de modifier, de déplacer ou de supprimer un message affiché au joueur (fenêtre, scène, conseil de Camille, bulle, alerte, « Nouveau ! », toast), lire `RYTHME.md` et respecter ses règles. Après un tel changement, mesurer avec `outils/frise-messages.js` (règle 9).

Mise en page en paysage : depuis la v585, toutes les règles `@media (orientation: landscape)` sont dans une seule feuille, `<style id="paysage">`, rangée par condition puis par zone de l'écran. Ne pas ajouter de bloc paysage ailleurs : écrire la règle dans cette feuille. Après tout changement de mise en page (portrait ou paysage), lancer `node outils/test-ecrans.js` (objectif : 0 caché, 0 dehors, 0 déborde, 0 vide).

Minuteries et observateurs (v658-v659) :
- `setInterval` est remplacé par un ordonnanceur commun (un seul réveil toutes les 40 ms, premier script de la page). Rien à changer pour la logique du jeu.
- Une correction d'interface (repositionner, renommer, ré-étiqueter un bouton, balayer un texte) ne s'écrit plus avec `setInterval` mais avec `__uiv(f, délai)` : `f` est appelée quand l'écran a pu changer (fenêtre ouverte ou modifiée, onglet, toucher, redimensionnement, appel à `ui()`) et toutes les 3 s par sécurité.
- Ne pas observer `document.body` avec `subtree`. Utiliser `__obsIn(['id'], f, options)` pour observer une fenêtre ou un écran précis quand il existe, ou `__bodyMut(f)` seulement si tout le document doit être vu.
- Après un changement de ce type, mesurer avec `node outils/minuteries.js URL` (objectif : moins de 100 appels par seconde, moins de 10 ms de calcul par seconde).
