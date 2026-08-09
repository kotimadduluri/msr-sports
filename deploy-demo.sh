#!/usr/bin/env bash
#
# Publish the review demo to GitHub Pages.
#
# Creates the repo if it does not exist, pushes the source, and switches Pages
# to build from the Actions workflow in .github/workflows/deploy-demo.yml.
# After the first run, every `git push` updates the live link on its own.
#
#   1. Token: https://github.com/settings/tokens?type=beta  (fine-grained)
#        Repository access : All repositories
#        Permissions       : Administration RW · Contents RW · Pages RW · Workflows RW
#   2. export GITHUB_TOKEN=github_pat_xxx GITHUB_USER=your-username
#   3. ./deploy-demo.sh
#
set -euo pipefail

REPO="${REPO:-msr-sports}"
: "${GITHUB_TOKEN:?set GITHUB_TOKEN}"
: "${GITHUB_USER:?set GITHUB_USER}"

cd "$(dirname "$0")"
api() { curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "$@"; }

echo "→ checking the token"
LOGIN=$(api https://api.github.com/user | sed -n 's/.*"login": *"\([^"]*\)".*/\1/p' | head -1)
[ -n "$LOGIN" ] || { echo "   token rejected by GitHub"; exit 1; }
echo "   authenticated as $LOGIN"

echo "→ creating $LOGIN/$REPO if it is not there yet"
api -X POST https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO\",\"description\":\"MSR Sports Academy, Chirala — website, admin app and review demo\",\"private\":false,\"has_issues\":true}" > /dev/null || true

echo "→ pushing the source"
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:$GITHUB_TOKEN@github.com/$LOGIN/$REPO.git"
git push -u origin main --force

echo "→ pointing Pages at the Actions workflow"
api -X POST "https://api.github.com/repos/$LOGIN/$REPO/pages" -d '{"build_type":"workflow"}' > /dev/null 2>&1 \
  || api -X PUT "https://api.github.com/repos/$LOGIN/$REPO/pages" -d '{"build_type":"workflow"}' > /dev/null 2>&1 \
  || true

echo
echo "Build running: https://github.com/$LOGIN/$REPO/actions"
echo "Link (live in a minute or two):"
echo "   https://$LOGIN.github.io/$REPO/"
