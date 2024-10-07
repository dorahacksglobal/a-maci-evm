#!/bin/bash

./shell/s2/g16s.sh msg
./shell/s2/gen-zkey.sh msg

./shell/s2/g16s.sh tally
./shell/s2/gen-zkey.sh tally

./shell/s2/g16s.sh deactivate
./shell/s2/gen-zkey.sh deactivate

./shell/s2/g16s.sh addKey
./shell/s2/gen-zkey.sh addKey
