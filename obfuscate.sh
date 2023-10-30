#!/bin/bash

javascript-obfuscator kyte-source.js --output kyte.js --compact true --string-array-encoding 'base64' --string-array-wrappers-type variable

# Get the current year
current_year=$(date +'%Y')

# Copyright text
copyright_notice="/**
 * Copyright 2020-$current_year KeyQ, Inc.
 * 
 * This source file is free software,
 * available under the following license:
 * MIT license
 * 
 * This source file is distributed in the hope that
 * it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.
 * See the license files for details.
 * 
 * For details please refer to: http://www.keyq.cloud
 * KyteJS
 * ©2020-$current_year KeyQ, Inc.
**/"

# Prepend the copyright notice to the kyte.js file
echo "$copyright_notice" | cat - kyte.js > temp && mv temp kyte.js

# Display success message
echo "Copyright notice prepended to kyte.js file successfully!"
