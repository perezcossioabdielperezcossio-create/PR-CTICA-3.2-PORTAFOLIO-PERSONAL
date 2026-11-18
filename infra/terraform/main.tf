terraform {
  required_version = ">= 1.10, < 2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    key          = "gym-portfolio/production.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

resource "aws_vpc" "gym" {
  cidr_block           = "10.30.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "gym-portfolio" }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.gym.id
  cidr_block        = "10.30.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  tags              = { Name = "gym-public" }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.gym.id
  cidr_block        = "10.30.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
  tags              = { Name = "gym-private" }
}

resource "aws_internet_gateway" "gym" {
  vpc_id = aws_vpc.gym.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.gym.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gym.id
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "web" {
  name        = "gym-portfolio"
  description = "HTTP, HTTPS and optional administrative SSH"
  vpc_id      = aws_vpc.gym.id
}

resource "aws_vpc_security_group_ingress_rule" "web" {
  for_each          = toset(["80", "443"])
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  count             = var.admin_cidr == "" ? 0 : 1
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = var.admin_cidr
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

resource "aws_vpc_security_group_egress_rule" "internet" {
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_key_pair" "deploy" {
  key_name   = "gym-portfolio-deploy"
  public_key = var.ssh_public_key
}

resource "aws_iam_role" "instance" {
  name = "gym-portfolio-instance"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "gym" {
  name = "gym-portfolio-instance"
  role = aws_iam_role.instance.name
}

resource "aws_instance" "gym" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.web.id]
  associate_public_ip_address = false
  key_name                    = aws_key_pair.deploy.key_name
  iam_instance_profile        = aws_iam_instance_profile.gym.name
  depends_on                  = [aws_route_table_association.public, aws_iam_role_policy_attachment.ssm]

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    encrypted   = true
    volume_type = "gp3"
    volume_size = 20
  }

  # Do not replace the VM and its SQLite data when Canonical releases a new AMI.
  lifecycle {
    ignore_changes  = [ami]
    prevent_destroy = true
  }

  tags = { Name = "gym-portfolio" }
}

resource "aws_eip" "web" {
  domain   = "vpc"
  instance = aws_instance.gym.id
}

output "public_ip" {
  value = aws_eip.web.public_ip
}

output "instance_id" {
  value = aws_instance.gym.id
}
