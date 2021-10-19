#!/bin/sh
pip freeze | sed 's/==/>=/g' > requirements.txt
