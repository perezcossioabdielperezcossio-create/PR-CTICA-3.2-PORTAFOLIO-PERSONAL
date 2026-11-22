# Exporta la IP para el inventario de Ansible y las comprobaciones del sitio.
output "public_ip" {
  value       = oci_core_instance.gym.public_ip
  description = "IPv4 pública asignada a la VM del gimnasio."
}

output "instance_ocid" {
  value       = oci_core_instance.gym.id
  description = "OCID de la instancia."
}

output "public_subnet_ocid" {
  value       = local.subnet_id
  description = "OCID de la subred donde se ejecuta la VM."
}

output "private_subnet_ocid" {
  value       = local.create_network ? oci_core_subnet.private[0].id : null
  description = "OCID de la subred privada cuando se crea la red del gimnasio."
}

# El runner usa este grupo para solicitar y retirar la regla SSH temporal.
output "network_security_group_id" {
  value       = oci_core_network_security_group.web.id
  description = "Identificador del grupo de seguridad de la VM."
}
