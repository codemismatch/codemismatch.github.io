#!/bin/bash
echo "Removing Build Directory."
rm -rf build
echo "Pushing existing development branch commit ..."
git push origin development
echo "Middleman Build ..."
middleman build
echo "Copy CNAME to build/ ..."
cp CNAME build/
cd build/
echo "Initialising Git ..."
git init
git remote add origin "https://github.com/codemismatch/codemismatch.github.io.git"
echo "Fetch --- "
git fetch --depth 0
git checkout --orphan master
git add .
echo "Automated Commit .."
git commit -m "Automated Deploy commit by build script $(date)"
git push origin master --force
