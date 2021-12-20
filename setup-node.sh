#!/bin/sh

apt-get update
apt-get install --yes wget unzip openssh-server net-tools gcc g++ make
apt-get --yes install ca-certificates curl gnupg lsb-release 
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install --yes docker-ce docker-ce-cli containerd.io

# usermod -aG docker $USER && newgrp docker

curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get update
apt-get install --yes nodejs openjdk-8-jdk

# apt install --yes software-properties-common
# add-apt-repository --yes --update ppa:ansible/ansible
# apt-get install --yes ansible wget unzip

[ ! -e fluree-*.zip ] && wget https://fluree-releases-public.s3.amazonaws.com/fluree-0.15-latest.zip

unzip fluree*.zip -d fluree
chmod -R 777 fluree
mv fluree/fluree* .
rm -r fluree/

docker pull openwhisk/standalone:nightly

npm install
sudo npm start
