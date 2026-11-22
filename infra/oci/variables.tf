variable "tenancy_ocid" {
  type        = string
  description = "OCID de la tenencia de Oracle Cloud."
}

variable "user_ocid" {
  type        = string
  description = "OCID del usuario con permisos para administrar esta infraestructura."
}

variable "fingerprint" {
  type        = string
  description = "Huella de la clave de firma de la API de OCI."
}

variable "private_key_path" {
  type        = string
  description = "Ruta local de la clave privada de la API de OCI, guardada fuera del repositorio."
}

variable "region" {
  type        = string
  description = "Identificador de la región OCI."
}

variable "compartment_ocid" {
  type        = string
  description = "OCID del compartimento donde se crearán los recursos."
}

variable "availability_domain" {
  type        = string
  description = "Nombre completo del dominio de disponibilidad de la VM."
}

variable "ubuntu_2404_image_ocid" {
  type        = string
  description = "OCID regional de una imagen Ubuntu 24.04 compatible con la forma de la VM."
}

variable "ssh_public_key_path" {
  type        = string
  description = "Ruta de la clave pública SSH para el usuario ubuntu."
}

variable "shape" {
  type        = string
  description = "Forma de la VM disponible en la región y dominio elegidos."
}

variable "flex_shape" {
  type = object({
    ocpus         = number
    memory_in_gbs = number
  })
  default     = null
  description = "CPU y RAM, solo para formas Flex."
}

variable "admin_cidr" {
  type        = string
  description = "IPv4 pública del administrador con máscara /32 para SSH."

  validation {
    condition     = can(cidrnetmask(var.admin_cidr)) && endswith(var.admin_cidr, "/32")
    error_message = "Indica una dirección IPv4 con máscara /32."
  }
}

variable "subnet_ocid" {
  type        = string
  default     = null
  description = "OCID de una subred pública ya existente. Si se omite, se crea la red del gimnasio."
}
