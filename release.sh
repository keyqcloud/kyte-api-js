#!/bin/bash

print_error() {
    echo "\033[1;31m$1\033[0m"
}

print_success() {
    echo "\033[1;32m$1\033[0m"
}

if [ "$#" -eq 1 ]; then
    # Check the CHANGELOG.md
    changelog_version=$(awk '/## /{print $2;exit}' CHANGELOG.md)

    if [ "$changelog_version" != "$1" ]; then
        print_error "Version in CHANGELOG.md does not match the release version."
        exit 1
    fi

    echo "Building Kyte.js v$1..."

    # Check if terser is installed
    if ! command -v terser &> /dev/null; then
        print_error "terser is not installed. Install it with: npm install -g terser"
        exit 1
    fi

    # Minify the source code using terser
    echo "Minifying source code with terser..."

    if ! terser kyte-source.js -c -m -o kyte.min.js; then
        print_error "Minification failed"
        exit 1
    fi
    print_success "Created kyte.min.js"

    # Copy to kyte.js for backwards compatibility (both are now minified)
    cp kyte.min.js kyte.js
    print_success "Created kyte.js (minified, for backwards compatibility)"

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
    echo "$copyright_notice" | cat - kyte.min.js > temp && mv temp kyte.min.js

    # Move kyte.js and kyte.min.js to releases/stable/
    mkdir -p releases/stable
    mv kyte.js releases/stable/
    mv kyte.min.js releases/stable/

    # Copy kyte.js to releases/archive/ with version
    mkdir -p releases/archive
    cp releases/stable/kyte.js releases/archive/kyte-$1.js

    echo "kyte.js and kyte.min.js moved to releases/stable/"
    echo "kyte-$1.js created in releases/archive/"

    # prepare for release
    echo "Creating tag for release version $1"

    # Scoped add — only the files release.sh is supposed to produce or
    # update. Avoids accidentally committing stray files in the working
    # tree (stale builds, editor scratch, untracked test artifacts).
    git add releases/stable/kyte.js \
            releases/stable/kyte.min.js \
            "releases/archive/kyte-$1.js" \
            CHANGELOG.md
    git commit -m "release $1"
    git push

    if [ $? -eq 0 ]; then
        echo "Committed and push $1 to git"
    else
        print_error "Git push failed."
        exit 1
    fi

    git tag "v$1"

    if [ $? -eq 0 ]; then
        echo "Git tag created successfully for v$1."
    else
        print_error "Git tag creation failed."
        exit 1
    fi

    # Push the tag to the origin
    git push origin --tags

    if [ $? -eq 0 ]; then
        echo "Git push successful. New release v$1 is available"
    else
        print_error "Git push failed."
        exit 1
    fi
fi