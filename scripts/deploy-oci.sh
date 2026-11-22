#!/usr/bin/env bash
set -euo pipefail

tf=(terraform -chdir=infra/oci)
# Cada ejecución recibe su propio identificador para retirar solo su regla SSH.
rule_description="gym-actions-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
tmp="${RUNNER_TEMP:?}/gym-deploy"
oci_cmd=(oci --config-file "$tmp/oci-config")

plan() {
  umask 077
  for name in OCI_STATE_BUCKET OCI_STATE_NAMESPACE OCI_TFVARS_JSON OCI_API_PRIVATE_KEY GYM_VM_SSH_PUBLIC_KEY GYM_DEPLOY_SSH_KEY GYM_SSH_KNOWN_HOSTS VNC_PASSWORD; do
    if [[ -z "${!name}" ]]; then
      printf 'Falta configurar %s en el entorno production.\n' "$name" >&2
      return 1
    fi
  done
  if [[ ! "$VNC_PASSWORD" =~ ^[[:graph:]]{6,8}$ ]]; then
    printf 'VNC_PASSWORD debe tener entre 6 y 8 caracteres imprimibles, sin espacios.\n' >&2
    return 1
  fi

  mkdir -p "$tmp"
  printf '%s\n' "$OCI_API_PRIVATE_KEY" | tr -d '\r' > "$tmp/api.pem"
  printf '%s\n' "$GYM_DEPLOY_SSH_KEY" | tr -d '\r' > "$tmp/ssh"
  printf '%s\n' "$GYM_SSH_KNOWN_HOSTS" | tr -d '\r' > "$tmp/known_hosts"
  ssh-keygen -y -P '' -f "$tmp/ssh" >/dev/null
  # Conserva en Terraform la llave pública original de la VM. Ansible usa otra llave.
  printf '%s\n' "$GYM_VM_SSH_PUBLIC_KEY" | tr -d '\r' > "$tmp/ssh.pub"
  ssh-keygen -l -f "$tmp/ssh.pub" >/dev/null

  # Las claves se escriben en el directorio temporal del runner.
  jq --arg api "$tmp/api.pem" --arg ssh "$tmp/ssh.pub" \
    '. + {private_key_path: $api, ssh_public_key_path: $ssh}' <<< "$OCI_TFVARS_JSON" > "$tmp/production.tfvars.json"
  jq -er --arg key "$tmp/api.pem" '
    "[DEFAULT]\ntenancy=\(.tenancy_ocid)\nuser=\(.user_ocid)\nfingerprint=\(.fingerprint)\nregion=\(.region)\nkey_file=\($key)"
  ' "$tmp/production.tfvars.json" > "$tmp/oci-config"

  cp infra/oci/backend.tf.example infra/oci/backend.tf
  "${tf[@]}" init -input=false \
    "-backend-config=bucket=$OCI_STATE_BUCKET" \
    "-backend-config=namespace=$OCI_STATE_NAMESPACE" \
    "-backend-config=region=$(jq -er '.region' "$tmp/production.tfvars.json")" \
    "-backend-config=key=gym-portfolio/production.tfstate" \
    "-backend-config=tenancy_ocid=$(jq -er '.tenancy_ocid' "$tmp/production.tfvars.json")" \
    "-backend-config=user_ocid=$(jq -er '.user_ocid' "$tmp/production.tfvars.json")" \
    "-backend-config=fingerprint=$(jq -er '.fingerprint' "$tmp/production.tfvars.json")" \
    "-backend-config=private_key_path=$tmp/api.pem"

  # Un estado vacío haría que Terraform intentara duplicar la infraestructura.
  if ! "${tf[@]}" state list | grep -Fx 'oci_core_instance.gym'; then
    printf 'Falta migrar al bucket el estado de la VM existente.\n' >&2
    return 1
  fi
  "${tf[@]}" plan -input=false -var-file="$tmp/production.tfvars.json" -out="$tmp/gym.tfplan"
  if ! "${tf[@]}" show -json "$tmp/gym.tfplan" |
    jq -e 'all(.resource_changes[]?; (.change.actions | index("delete")) == null)' >/dev/null; then
    printf 'El plan elimina o reemplaza recursos. Revísalo antes de desplegar.\n' >&2
    return 1
  fi
}

apply() {
  "${tf[@]}" apply -input=false "$tmp/gym.tfplan"
  local ip nsg runner_ip rules
  ip=$("${tf[@]}" output -raw public_ip)
  nsg=$("${tf[@]}" output -raw network_security_group_id)
  runner_ip=$(curl -4 -fsS --max-time 15 https://api.ipify.org)
  python -c 'import ipaddress,sys; assert ipaddress.IPv4Address(sys.argv[1]).is_global' "$runner_ip"
  printf '%s\n' "$nsg" > "$tmp/nsg"
  ssh-keygen -F "$ip" -f "$tmp/known_hosts" >/dev/null

  # OCI permite una sola IPv4 del runner durante este despliegue.
  rules=$(jq -cn --arg ip "$runner_ip/32" --arg name "$rule_description" \
    '[{direction:"INGRESS",protocol:"6",source:$ip,sourceType:"CIDR_BLOCK",description:$name,isStateless:false,tcpOptions:{destinationPortRange:{min:22,max:22}}}]')
  "${oci_cmd[@]}" network nsg rules add --nsg-id "$nsg" --security-rules "$rules" >/dev/null

  export ADMIN_CIDR
  ADMIN_CIDR=$(jq -er '.admin_cidr' "$tmp/production.tfvars.json")
  export GYM_SSH_FILTER_AT_OCI=true
  printf '[gym]\n%s ansible_user=ubuntu\n' "$ip" > "$tmp/inventory.ini"
  ansible-playbook -i "$tmp/inventory.ini" --private-key "$tmp/ssh" \
    --ssh-common-args="-o StrictHostKeyChecking=yes -o UserKnownHostsFile=$tmp/known_hosts" \
    infra/ansible/site.yml

  local url="http://$ip"
  if [[ -n "${SITE_DOMAIN:-}" ]]; then url="https://$SITE_DOMAIN"; fi
  curl -fsS --max-time 10 --retry 12 --retry-delay 5 --retry-all-errors "$url/api/health" |
    jq -e '.status == "ok"' >/dev/null
  printf 'Gimnasio desplegado en %s\n' "$url" >> "$GITHUB_STEP_SUMMARY"
}

cleanup() {
  if [[ ! -s "$tmp/nsg" ]]; then return 0; fi
  local nsg ids
  nsg=$(cat "$tmp/nsg")
  ids=$("${oci_cmd[@]}" network nsg rules list --nsg-id "$nsg" --all |
    jq -c --arg name "$rule_description" '[.data[] | select(.description == $name) | .id]')
  if [[ "$ids" != '[]' ]]; then
    "${oci_cmd[@]}" network nsg rules remove --nsg-id "$nsg" --security-rule-ids "$ids"
  fi
}

case "${1:-}" in
  plan) plan ;;
  apply) apply ;;
  cleanup) cleanup ;;
  *) printf 'Uso: deploy-oci.sh plan|apply|cleanup\n' >&2; exit 2 ;;
esac
