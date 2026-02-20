#!/usr/bin/env bash
set -euo pipefail

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

npm ci
npm run build
