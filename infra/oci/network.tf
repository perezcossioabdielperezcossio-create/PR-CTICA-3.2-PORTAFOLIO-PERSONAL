# Permite crear una VCN para el gimnasio o usar una subred pública existente.
locals {
  create_network = var.subnet_ocid == null
  vcn_id         = local.create_network ? oci_core_vcn.gym[0].id : data.oci_core_subnet.existing[0].vcn_id
  subnet_id      = local.create_network ? oci_core_subnet.public[0].id : var.subnet_ocid
}

data "oci_core_subnet" "existing" {
  count     = local.create_network ? 0 : 1
  subnet_id = var.subnet_ocid
}

resource "oci_core_vcn" "gym" {
  count          = local.create_network ? 1 : 0
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.30.0.0/16"]
  display_name   = "gym-vcn"
  dns_label      = "gym"
}

resource "oci_core_internet_gateway" "gym" {
  count          = local.create_network ? 1 : 0
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.gym[0].id
  display_name   = "gym-internet"
  enabled        = true
}

# La subred pública usa esta ruta para llegar al Internet Gateway.
resource "oci_core_route_table" "public" {
  count          = local.create_network ? 1 : 0
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.gym[0].id
  display_name   = "gym-public"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.gym[0].id
  }
}

resource "oci_core_security_list" "subnets" {
  count          = local.create_network ? 1 : 0
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.gym[0].id
  display_name   = "gym-subnets"
}

resource "oci_core_subnet" "public" {
  count                      = local.create_network ? 1 : 0
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.gym[0].id
  cidr_block                 = "10.30.1.0/24"
  dns_label                  = "publica"
  display_name               = "gym-public"
  route_table_id             = oci_core_route_table.public[0].id
  security_list_ids          = [oci_core_security_list.subnets[0].id]
  prohibit_public_ip_on_vnic = false
}

# La subred privada bloquea las IP públicas y usa la tabla sin salida directa a Internet.
resource "oci_core_subnet" "private" {
  count                      = local.create_network ? 1 : 0
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.gym[0].id
  cidr_block                 = "10.30.2.0/24"
  dns_label                  = "privada"
  display_name               = "gym-private"
  route_table_id             = oci_core_vcn.gym[0].default_route_table_id
  security_list_ids          = [oci_core_security_list.subnets[0].id]
  prohibit_public_ip_on_vnic = true
}

resource "oci_core_network_security_group" "web" {
  compartment_id = var.compartment_ocid
  vcn_id         = local.vcn_id
  display_name   = "gym-web"
}

# HTTP y HTTPS son públicos. SSH queda limitado al CIDR administrativo.
resource "oci_core_network_security_group_security_rule" "ingress" {
  for_each = {
    "22"  = var.admin_cidr
    "80"  = "0.0.0.0/0"
    "443" = "0.0.0.0/0"
  }

  network_security_group_id = oci_core_network_security_group.web.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = each.value
  source_type               = "CIDR_BLOCK"
  stateless                 = false

  tcp_options {
    destination_port_range {
      min = tonumber(each.key)
      max = tonumber(each.key)
    }
  }
}

resource "oci_core_network_security_group_security_rule" "egress" {
  network_security_group_id = oci_core_network_security_group.web.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  stateless                 = false
}
