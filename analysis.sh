#!/bin/sh
for filenamme in *; do
  if [ "$filename" != node_modules ]; then
    echo module.exports = "'$filenamme'" > readAnalysisFile.js
    gulp analysis
  fi
done
rm readAnalysisFile.js
