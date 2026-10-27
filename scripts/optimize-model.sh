#!/usr/bin/env bash
# Usage (Git Bash/WSL, from repo root): bash scripts/optimize-model.sh
set -euo pipefail

IN="assets-src/korean_fire_extinguisher_01/korean_fire_extinguisher_01_1k.gltf"
OUT="public/models/apar.glb"
LIBS="node_modules/three/examples/jsm/libs"

# KTX2 needs toktx (KTX-Software); without it fall back to WebP.
if command -v toktx >/dev/null 2>&1; then TEX=ktx2; else TEX=webp; fi
echo "Texture format: $TEX"

npx gltf-transform optimize "$IN" "$OUT" \
  --compress draco \
  --texture-compress "$TEX" \
  --texture-size 1024 \
  --simplify false

mkdir -p public/decoders/draco public/decoders/basis
cp "$LIBS"/draco/gltf/* public/decoders/draco/
cp "$LIBS"/basis/basis_transcoder.* public/decoders/basis/

ls -l "$OUT"
