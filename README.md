# Portafolio personal · Registro de gimnasio

Portafolio académico de Abdiel Pérez Cossío con una demo funcional para registrar socios. React y Vite sirven la interfaz, Express expone la API y SQLite guarda el nombre, correo único y fecha de alta. La demo pública está pensada para datos ficticios.

## Ejecutar en local

Requiere Node.js 24 o superior.

```sh
npm ci
npm run build
npm start
```

Abre [localhost:3000](http://localhost:3000). Para desarrollo con recarga en caliente, abre otra terminal, ejecuta `npm run dev` y entra a la URL que indique Vite. Mantén `npm start` activo para que Vite pueda redirigir las solicitudes de la API. SQLite se guarda en `data/gym.sqlite`. Puedes cambiar la ruta con `DB_PATH`.

### Pruebas

```sh
npx playwright install chromium
npm test
```

| Suite | Casos |
| --- | --- |
| Unitarias | Normalización de datos, nombres inválidos y correos inválidos |
| Integración | Alta persistente en SQLite, rechazo de duplicados y rechazo de datos inválidos sin escribir |
| E2E | Navegación y alta desde el portafolio, aviso de correo duplicado y mensaje de validación |

### Docker

Con Docker Engine activo y Compose v2:

```sh
docker compose up --build -d
curl http://localhost/api/health
docker compose down
```

Abre [localhost](http://localhost). SQLite vive en el volumen `gym-data`, que se conserva al ejecutar `docker compose down`. El puerto 3000 queda dentro de la red de Compose y Caddy publica los puertos 80 y 443.

## GitHub Actions

El flujo está en [pipeline.yml](.github/workflows/pipeline.yml).

| Push | Resultado |
| --- | --- |
| `dev` | Ejecuta las 9 pruebas automáticamente. |
| `main` | Ejecuta las pruebas, publica la imagen etiquetada con el SHA en Docker Hub, aprovisiona AWS con Terraform, configura Ubuntu y despliega la imagen por digest con Ansible. El resumen incluye la URL si responde la comprobación de salud. |

### Preparar el primer despliegue

1. Crea el repositorio `gym-portfolio` en Docker Hub. Genera un token con permiso de lectura y escritura.
2. Crea un bucket S3 privado con versionado y cifrado, en la región del despliegue. Terraform guarda el estado en `gym-portfolio/production.tfstate` y usa un archivo de bloqueo.
3. Configura en AWS el proveedor OIDC de GitHub Actions `https://token.actions.githubusercontent.com` con audiencia `sts.amazonaws.com`. En la política de confianza del rol, restringe el claim `sub` a `repo:PROPIETARIO/REPOSITORIO:ref:refs/heads/main`. Autoriza al rol a administrar los recursos EC2 y el rol/perfil de instancia declarados en Terraform, incluido `iam:PassRole` sobre el rol de la instancia. Dale acceso al estado y su bloqueo S3 y permiso `ssm:StartSession` para la instancia y el documento `AWS-StartSSHSession`. Limita los permisos al entorno de este proyecto.
4. Genera un par de llaves SSH dedicado, sin frase de paso, para el runner (`ssh-keygen -t ed25519 -f gym-deploy`). Guarda la llave fuera del repositorio.
5. Configura los valores en **Settings → Secrets and variables → Actions** antes del primer push a `main`.

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Variable | `DOCKERHUB_USERNAME` | Usuario de Docker Hub en minúsculas |
| Variable | `AWS_ROLE_ARN` | ARN del rol OIDC autorizado para `main` |
| Variable | `AWS_REGION` | Región de EC2 y del bucket S3, con al menos dos AZ |
| Variable | `TF_STATE_BUCKET` | Nombre del bucket S3 |
| Secreto | `DOCKERHUB_TOKEN` | Token de Docker Hub |
| Secreto | `EC2_SSH_PUBLIC_KEY` | Contenido de `gym-deploy.pub` |
| Secreto | `EC2_SSH_PRIVATE_KEY` | Contenido completo de `gym-deploy` |
| Secreto | `VNC_PASSWORD` | Contraseña dedicada de 6 a 8 caracteres ASCII imprimibles sin espacios |
| Variable opcional | `ADMIN_CIDR` | IP administrativa con máscara, por ejemplo `203.0.113.20/32`, para permitir SSH directo |

Terraform crea una VPC, una subred pública, una privada, una EC2 Ubuntu 24.04 LTS y una Elastic IP. La instancia usa un disco cifrado de 20 GiB y tiene protección contra destrucción accidental por Terraform. Ansible entra por SSH sobre AWS Systems Manager, instala Docker, Compose, Git, UFW, iptables y TigerVNC. UFW autoriza 80/443 en el host y Docker gestiona sus reglas de iptables para los dos puertos publicados. El security group también restringe el tráfico público a 80/443 y, si se configura, al CIDR administrativo para SSH. El runner acepta la llave de host en su primera conexión por el canal de SSM autenticado para esa instancia.

AWS factura los recursos aprovisionados, incluida la IP pública. Conserva el volumen de SQLite durante las actualizaciones normales y respalda la base antes de cualquier reemplazo de la VM.

### VNC

TigerVNC ejecuta una sesión gráfica ligera con terminal en `127.0.0.1:5901`. Para entrar, usa AWS CLI con el complemento Session Manager y una identidad con permiso `ssm:StartSession` sobre la instancia y el documento `AWS-StartPortForwardingSession`.

```sh
aws ssm start-session --target ID_INSTANCIA --document-name AWS-StartPortForwardingSession --parameters portNumber=5901,localPortNumber=5901
```

En el visor VNC configura host `127.0.0.1`, puerto TCP `5901` y la contraseña configurada. Con `ADMIN_CIDR` también puedes abrir un túnel SSH directo con `ssh -i gym-deploy -N -L 5901:127.0.0.1:5901 ubuntu@IP_PUBLICA`.

### Cloudflare y HTTPS

Con un dominio activo en Cloudflare, elige un subdominio libre, por ejemplo `gym.tudominio.com`, y agrega estos valores **antes** del push a `main`:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Variable | `SITE_DOMAIN` | Subdominio, sin protocolo ni ruta |
| Variable | `CLOUDFLARE_ZONE_ID` | ID de la zona que contiene el dominio |
| Secreto | `CLOUDFLARE_API_TOKEN` | Token con permiso `Zone / DNS / Edit` para esa zona |

Ansible crea un registro A en modo DNS hacia la Elastic IP y Caddy obtiene y renueva el certificado HTTPS. Cloudflare requiere que ya tengas un dominio delegado en su servicio. Si omites `SITE_DOMAIN`, el despliegue publica la demo por HTTP en la IP pública.

### Referencias

- [Estado remoto y permisos de Terraform en S3](https://developer.hashicorp.com/terraform/language/backend/s3)
- [SSH a través de AWS Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started-enable-ssh-connections.html)
- [Docker Engine en Ubuntu y reglas de firewall](https://docs.docker.com/engine/install/ubuntu/)
- [API de registros DNS de Cloudflare](https://developers.cloudflare.com/api/resources/dns/subresources/records/)
