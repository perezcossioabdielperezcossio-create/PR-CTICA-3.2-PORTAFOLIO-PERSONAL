resource "oci_core_instance" "gym" {
  compartment_id      = var.compartment_ocid
  display_name        = var.deployment_id == null ? "gym-ubuntu-web" : "gym-ubuntu-web-${var.deployment_id}"
  availability_domain = var.availability_domain
  shape               = var.shape

  # Las formas Flex requieren CPU y RAM explícitas. La Micro usa sus recursos fijos.
  dynamic "shape_config" {
    for_each = var.flex_shape == null ? [] : [var.flex_shape]

    content {
      ocpus         = shape_config.value.ocpus
      memory_in_gbs = shape_config.value.memory_in_gbs
    }
  }

  source_details {
    source_type = "image"
    source_id   = var.ubuntu_2404_image_ocid
  }

  # Conecta la VM a la subred pública y solicita una IPv4 para acceder desde Internet.
  create_vnic_details {
    subnet_id        = local.subnet_id
    nsg_ids          = [oci_core_network_security_group.web.id]
    assign_public_ip = true
    display_name     = "gym-web-vnic"
    hostname_label   = local.create_network ? "gym-web" : null
  }

  # OCI instala la clave pública SSH cuando inicia Ubuntu.
  metadata = merge({
    ssh_authorized_keys = join("\n", compact([
      trimspace(file(pathexpand(var.ssh_public_key_path))),
      var.deploy_ssh_public_key,
    ]))
    }, var.deployment_id == null ? {} : {
    # Publica únicamente la clave pública del servidor en su consola serial de OCI.
    user_data = base64encode("#cloud-config\n${yamlencode({
      runcmd = [["sh", "-c", "{ printf 'GYM_OCI_HOST_KEY '; cat /etc/ssh/ssh_host_ed25519_key.pub; } > /dev/ttyS0"]]
    })}")
  })

  lifecycle {
    precondition {
      condition     = local.create_network ? true : !data.oci_core_subnet.existing[0].prohibit_public_ip_on_vnic
      error_message = "La subred existente debe permitir direcciones IP públicas."
    }
  }
}
