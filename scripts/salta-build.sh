#!/usr/bin/env bash
# Filtro delle build di Vercel (vercel.json → "ignoreCommand": "bash scripts/salta-build.sh").
# Vercel lo esegue nella cartella del progetto prima di ogni build: uscita 0 = salta, 1 = costruisci.
# Modello: officina/conoscenza/vercel/risparmio.md. Nel dubbio si costruisce.

# File che non finiscono online: una modifica solo qui non merita una build.
ESCLUDI=(':(exclude)*.md' ':(exclude).github' ':(exclude).claude' ':(exclude)docs'
         ':(exclude)**/*.test.*' ':(exclude)**/*.spec.*' ':(exclude)tests' ':(exclude)test' ':(exclude)e2e')

ramo="$VERCEL_GIT_COMMIT_REF"
if [ "$VERCEL_ENV" != production ]; then
  case "$ramo" in
    dependabot/*) echo "Anteprima di Dependabot: si costruisce (serve alle unioni automatiche)." ;;
    *) if ! printf %s "$VERCEL_GIT_COMMIT_MESSAGE" | grep -q '\[anteprima\]'; then
         echo "Anteprima saltata: scrivi [anteprima] nel commit per averla."
         exit 0
       fi ;;
  esac
fi

# Confronto con l'ultimo deploy di questo ramo; se Vercel non ce l'ha nel clone, con il commit prima.
# git diff esce 0 (uguali), 1 (diversi) o 128 (errore): un errore non deve diventare un deploy fallito.
for base in "$VERCEL_GIT_PREVIOUS_SHA" HEAD^; do
  [ -n "$base" ] && git cat-file -e "$base^{commit}" 2>/dev/null || continue
  git diff --quiet "$base" HEAD -- . "${ESCLUDI[@]}"
  r=$?
  [ $r -eq 0 ] && { echo "Nessun file pubblicato è cambiato: build saltata."; exit 0; }
  [ $r -eq 1 ] && { echo "File cambiati: si costruisce."; exit 1; }
done
echo "Confronto non possibile: si costruisce."
exit 1
