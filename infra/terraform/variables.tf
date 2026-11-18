variable "ssh_public_key" {
  description = "OpenSSH public key corresponding to the GitHub Actions private key."
  type        = string
}

variable "admin_cidr" {
  description = "Optional administrative IPv4 CIDR for direct SSH and VNC tunnels."
  type        = string
  default     = ""

  validation {
    condition     = var.admin_cidr == "" || can(cidrnetmask(var.admin_cidr)) && var.admin_cidr != "0.0.0.0/0"
    error_message = "Use a restricted IPv4 CIDR, such as your public IP followed by /32."
  }
}

variable "instance_type" {
  description = "AMD64 EC2 instance type."
  type        = string
  default     = "t3.small"
}
