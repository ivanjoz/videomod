#!/bin/bash
AWS_PROFILE="iangulo011"
AWS_ROLE_ARN="arn:aws:iam::590183826101:role/deployment-role"

echo "Seleccione acciones a realizar: (Es posible escoger más de 1. Ejemplo: '123')"
echo "[1] Build Frontend [2] Deploy Backend [3] Deploy Infra"
read ACCIONES

echo "Obteniendo los últimos cambios del repositorio (GIT PULL)..."

if [[ $ACCIONES == *"1"* || $ACCIONES == *"2"* || $ACCIONES == *"3"* ]]; then
    git pull
fi


#PUBLICAR FRONTEND
if [[ $ACCIONES == *"1"* ]]; then

    echo "=== BUILDING FRONTEND ==="

    npm run build --prefix ./frontend
    node build.js

    echo "Frontend build finished!"

fi

#PUBLICAR BACKEND
if [[ $ACCIONES == *"2"* ]]; then
    echo "Usando AWS Profile: $AWS_PROFILE"

    echo "=== PUBLICANDO BACKEND ==="

    cd ./cloud
    go run . accion=1

    echo "El deploy backend-node finalizado!"

fi

#PUBLICAR INFRA
if [[ $ACCIONES == *"3"* ]]; then
    echo "Usando AWS Profile: $AWS_PROFILE"

    echo "=== PUBLICANDO INFRA CON AWS SDK ==="

    cd ./cloud

    echo "Ejecutando: cdk --profile $AWS_PROFILE --role-arn $AWS_ROLE_ARN deploy"
    cdk --role-arn $AWS_ROLE_ARN --profile $AWS_PROFILE bootstrap
    cdk --role-arn $AWS_ROLE_ARN --profile $AWS_PROFILE deploy

    echo "El deploy ha finalizado!"

fi

echo "Finalizado!. Presione cualquier tecla para salir"
read
kill -9 $PPID
