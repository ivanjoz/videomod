#!/bin/bash
AWS_PROFILE="ivanjoz"
AWS_S3="gerp-v2-frontend"
FUNCTION_NAME="jobfinder6-p-app"
PUBLICAR_ASSETS=""

echo "Seleccione acciones a realizar: (Es posible escoger más de 1. Ejemplo: '123')"
echo "[1] Build Frontend [2] Deploy Backend"
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


echo "Finalizado!. Presione cualquier tecla para salir"
read
kill -9 $PPID
