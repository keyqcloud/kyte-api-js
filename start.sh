#!/bin/bash

ver=$(python -c"import sys; print(sys.version_info.major)")
if [ $ver -eq 2 ]; then
    python -m SimpleHTTPServer
elif [ $ver -eq 3 ]; then
    python -m http.server
else 
    echo "Unknown python version: $ver"
    python3 -m http.server
fi

