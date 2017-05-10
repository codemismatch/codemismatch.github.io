#!/bin/bash
echo "Removing Build Directory\n"
rm -rf build
echo "Pushing existing development branch commit ...\n"
git push origin development
echo "Middleman Build ...\n"
middleman build
echo "Copy CNAME to build/ ...\n"
cp CNAME build/
cd build/
echo "Initialising Git ...\n"
git init
git remote add origin "https://github.com/codemismatch/codemismatch.github.io.git"
echo "Fetch --- \n"
git fetch --depth 0
git checkout --orphan master
git add .
echo "Automated Commit ..\n"
git commit -m "Automated Deploy commit by build script $(date)"
git push origin master --force