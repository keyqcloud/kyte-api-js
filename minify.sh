#!/bin/bash

# Read the contents of kyte-source.js
input_file="kyte-source.js"
input_contents=$(cat "$input_file")
response=$(curl -X POST -s --data-urlencode "input=$input_contents" https://www.toptal.com/developers/javascript-minifier/api/raw)

# Save the response as kyte.min.js
output_file="kyte.min.js"
echo "$response" > "$output_file"

echo "Minified JavaScript saved as $output_file"

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
echo "$copyright_notice" | cat - kyte.min.js > temp && mv temp kyte.min.js

# Display success message
echo "Copyright notice prepended to kyte.js file successfully!"