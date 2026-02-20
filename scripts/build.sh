#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v npm >/dev/null 2>&1; then
	export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

	if [ ! -s "$NVM_DIR/nvm.sh" ]; then
		if command -v curl >/dev/null 2>&1; then
			curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
		elif command -v wget >/dev/null 2>&1; then
			wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
		else
			echo "Error: npm is missing and neither curl nor wget is available to install Node.js."
			exit 1
		fi
	fi

	# shellcheck disable=SC1090
	. "$NVM_DIR/nvm.sh"
	nvm install 20
	nvm use 20
fi

rm -rf node_modules

if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
	npm ci --no-audit --no-fund || {
		rm -rf node_modules
		npm ci --no-audit --no-fund
	}
else
	npm install --no-audit --no-fund || {
		rm -rf node_modules
		npm install --no-audit --no-fund
	}
fi

npm run build
