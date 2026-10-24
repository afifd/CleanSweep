#!/usr/bin/env bash
set -euo pipefail

# CleanSweep Contract Verification Helper for Monad Testnet
# Verifies contracts across MonadVision, Socialscan, Monadscan via https://agents.devnads.com/v1/verify
# Fallback to Sourcify on Blockvision

CHAIN_ID="10143"
COMPILER_VERSION="v0.8.28+commit.7893614a"

verify_target() {
    local ADDR="$1"
    local CONTRACT_PATH="$2"
    local CONSTRUCTOR_ARGS="${3:-}"

    echo "==> Preparing verification for ${CONTRACT_PATH} at ${ADDR}..."
    
    cd contracts
    ~/.foundry/bin/forge verify-contract "${ADDR}" "${CONTRACT_PATH}" \
        --chain "${CHAIN_ID}" \
        --show-standard-json-input > /tmp/standard-input.json

    local CONTRACT_NAME="${CONTRACT_PATH##*:}"
    cat "out/${CONTRACT_NAME}.sol/${CONTRACT_NAME}.json" | jq '.metadata' > /tmp/metadata.json

    if [ -n "${CONSTRUCTOR_ARGS}" ]; then
        CONSTRUCTOR_ARGS_STR="${CONSTRUCTOR_ARGS#0x}"
        jq -n \
          --arg chainId "${CHAIN_ID}" \
          --arg contractAddress "${ADDR}" \
          --arg contractName "${CONTRACT_PATH}" \
          --arg compilerVersion "${COMPILER_VERSION}" \
          --slurpfile standardJsonInput /tmp/standard-input.json \
          --slurpfile foundryMetadata /tmp/metadata.json \
          --arg constructorArgs "${CONSTRUCTOR_ARGS_STR}" \
          '{
            chainId: ($chainId | tonumber),
            contractAddress: $contractAddress,
            contractName: $contractName,
            compilerVersion: $compilerVersion,
            standardJsonInput: $standardJsonInput[0],
            foundryMetadata: $foundryMetadata[0],
            constructorArgs: $constructorArgs
          }' > /tmp/verify.json
    else
        jq -n \
          --arg chainId "${CHAIN_ID}" \
          --arg contractAddress "${ADDR}" \
          --arg contractName "${CONTRACT_PATH}" \
          --arg compilerVersion "${COMPILER_VERSION}" \
          --slurpfile standardJsonInput /tmp/standard-input.json \
          --slurpfile foundryMetadata /tmp/metadata.json \
          '{
            chainId: ($chainId | tonumber),
            contractAddress: $contractAddress,
            contractName: $contractName,
            compilerVersion: $compilerVersion,
            standardJsonInput: $standardJsonInput[0],
            foundryMetadata: $foundryMetadata[0]
          }' > /tmp/verify.json
    fi

    echo "Submitting to Monad verification API..."
    RES=$(curl -s -X POST https://agents.devnads.com/v1/verify \
        -H "Content-Type: application/json" \
        -d @/tmp/verify.json || echo '{"error":"request failed"}')
    echo "API Response: ${RES}"

    # Fallback to sourcify if API returned error
    if echo "${RES}" | grep -qi "error"; then
        echo "Using Sourcify fallback..."
        ~/.foundry/bin/forge verify-contract "${ADDR}" "${CONTRACT_PATH}" --chain "${CHAIN_ID}" \
            --verifier sourcify \
            --verifier-url "https://sourcify-api-monad.blockvision.org/" || true
    fi
    cd ..
}

case "${1:-}" in
    vault)
        verify_target "$2" "src/BountyVault.sol:BountyVault" "${3:-}"
        ;;
    sbt)
        verify_target "$2" "src/CivicHeroSBT.sol:CivicHeroSBT" "${3:-}"
        ;;
    *)
        echo "Usage: $0 [vault|sbt] <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS_HEX]"
        exit 1
        ;;
esac
