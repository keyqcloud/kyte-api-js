#!/bin/bash

# Set the input and output file names
input_file="kyte-source.js"
output_file="kyte.min.js"

# Check if UglifyJS is installed
if ! command -v uglifyjs &> /dev/null; then
    echo "UglifyJS is not installed. Please install it using 'npm install -g uglify-js'."
    exit 1
fi

# Minify the JavaScript file
uglifyjs "$input_file" -o "$output_file"

echo "Minification complete. Minified file saved as $output_file."
