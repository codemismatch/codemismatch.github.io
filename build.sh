#!/bin/bash
echo "Removing Build Directory."
rm -rf build
echo "Pushing existing development branch commit ..."
git push origin development
echo "Middleman Build ..."
middleman build
echo "Copy CNAME to build/ ..."
cp CNAME build/
echo "Copy Google Site Verification page ..."
cp source/pages/google* build/
cd build/
echo "Initialising Git ..."
git init
git remote add origin "https://github.com/codemismatch/codemismatch.github.io.git"
echo "Initialising an orphan branch"
git checkout --orphan master
echo "Adding Files"
git add .
echo "Automated Commit .."
git commit -m "Automated commit by build script $(date)"
git push origin master --force
