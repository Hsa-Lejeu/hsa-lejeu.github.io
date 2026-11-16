# Appli Android (WebView)

L'appli ouvre https://hsa-lejeu.github.io/ dans une WebView : les mises à jour du site arrivent sans republier l'appli. Elle remplace l'ancienne version TWA (PWABuilder), avec le même identifiant `io.github.hsalejeu.haltesoinsaddictions` et la même clé d'envoi.

- Construite par GitHub Actions (`.github/workflows/android.yml`) à chaque changement dans `android/`, ou à la main depuis l'onglet Actions (« Run workflow »). Le résultat (`.aab` pour la Play Console, `.apk` pour l'installer directement) est dans les « Artifacts » de l'exécution.
- `versionCode` = 100 + numéro de l'exécution.
- La clé d'envoi est chiffrée dans `signing.keystore.enc` ; il faut deux secrets dans le dépôt : `ENC_PASS` (déchiffrement) et `KS_PASS` (mot de passe de la clé).
- Pont avec la page : `window.HSAApp.save(base64, nom)` enregistre une image dans Images/Halte Soins Addictions ; `window.HSAApp.share(base64, texte, nom)` ouvre le partage d'Android. Le tableau souvenir s'en sert quand il existe.
