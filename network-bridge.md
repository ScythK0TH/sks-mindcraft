docker network create opc-mc-bridge
docker network connect opc-mc-bridge sks-mindcraft-mindcraft-1
docker network connect opc-mc-bridge setup-openclaw-gateway-1