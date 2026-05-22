#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

cleanup_node_modules() {
	if [ ! -d node_modules ]; then
		return 0
	fi

	local backup_dir="node_modules.stale.$(date +%s)"

	if mv node_modules "$backup_dir" 2>/dev/null; then
		rm -rf "$backup_dir" || true
		return 0
	fi

	for attempt in 1 2 3; do
		rm -rf node_modules && return 0
		echo "Retrying node_modules cleanup (attempt $attempt)..." >&2
		date >/dev/null
	done

	echo "Warning: could not fully remove existing node_modules; continuing with a fresh install attempt." >&2
	return 0
}

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

cleanup_node_modules

if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
	npm ci --no-audit --no-fund || {
		cleanup_node_modules
		npm ci --no-audit --no-fund
	}
else
	npm install --no-audit --no-fund || {
		cleanup_node_modules
		npm install --no-audit --no-fund
	}
fi

# Build output for EDITO static serving
mkdir -p site
npm run build -- --configuration production --output-path site
