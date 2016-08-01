#!/bin/bash

sudo apt-get update
sudo apt-get install nodejs --assume-yes
sudo apt-get install gcc --assume-yes
sudo apt-get install python-dev --assume-yes
sudo apt-get install nginx --assume-yes

echo "Installing pip..."

wget https://bootstrap.pypa.io/get-pip.py -O - -q | sudo python
wget https://raw.githubusercontent.com/nginx/nginx/master/conf/uwsgi_params -q

sudo pip install uwsgi
sudo mkdir -p /etc/uwsgi/vassals
sudo ln -s /home/wojtekzozlak/wargame/wargame_uwsgi.ini /etc/uwsgi/vassals
sudo chgrp www-data ./ -R
sudo chmod 775 ./
sudo sed -ie '$i \/usr/local/bin/uwsgi --emperor /etc/uwsgi/vassals --uid www-data --gid www-data --daemonize /var/log/uwsgi-emperor.log\n' /etc/rc.local

sudo pip install virtualenv

virtualenv ./
source bin/activate

pip install django
pip install south
pip install django-markdown-deux
pip install uwsgi

sudo ln -s /home/wojtekzozlak/wargame/wargame_nginx.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
touch wargame.socket
sudo chgrp www-data wargame.socket 

sudo service nginx restart
