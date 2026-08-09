#!/usr/bin/env bash
# Publish the review demo to GitHub Pages and print the public URL.
#
#   1. Make a token at https://github.com/settings/tokens?type=beta
#      with Repository access: All repositories, and permissions:
#      Administration = Read & write, Contents = Read & write, Pages = Read & write
#   2. export GITHUB_TOKEN=github_pat_xxx
#      export GITHUB_USER=your-github-username
#   3. ./deploy-demo.sh
#
set -euo pipefail

REPO="${REPO:-msr-sports-demo}"
: "${GITHUB_TOKEN:?set GITHUB_TOKEN}"
: "${GITHUB_USER:?set GITHUB_USER}"

cd "$(dirname "$0")"

echo "→ building the demo"
( cd web && VITE_DEMO=1 npm run build:demo )
touch web/dist-demo/.nojekyll

echo "→ creating the repository (skipped if it already exists)"
curl -sS -X POST https://api.github.com/user/repos \
  -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
  -d "{\"name\":\"$REPO\",\"description\":\"MSR Sports Academy — review demo\",\"private\":false}" > /dev/null || true

echo "→ pushing the build"
rm -rf /tmp/msr-pages && cp -r web/dist-demo /tmp/msr-pages
cd /tmp/msr-pages
git init -q && git checkout -qB main
git add -A
git -c user.email="deploy@msrsports.in" -c user.name="MSR Deploy" commit -qm "Publish demo"
git remote add origin "https://x-access-token:$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO.git"
git push -qf origin main

echo "→ turning on GitHub Pages"
curl -sS -X POST "https://api.github.com/repos/$GITHUB_USER/$REPO/pages" \
  -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
  -d '{"source":{"branch":"main","path":"/"}}' > /dev/null || \
curl -sS -X PUT "https://api.github.com/repos/$GITHUB_USER/$REPO/pages" \
  -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
  -d '{"source":{"branch":"main","path":"/"}}' > /dev/null || true

echo
echo "Done. The link goes live in about a minute:"
echo "   https://$GITHUB_USER.github.io/$REPO/"
