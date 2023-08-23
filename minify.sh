#!/bin/bash

# Read the contents of kyte-source.js
input_file="kyte-source.js"
input_contents=$(cat "$input_file")
response=$(curl -X POST -s --data-urlencode "input=$input_contents" https://www.toptal.com/developers/javascript-minifier/api/raw)

# Save the response as kyte.min.js
output_file="kyte.min.js"
echo "$response" > "$output_file"

echo "Minified JavaScript saved as $output_file"
