/**
 * @fileoverview Azure AKS Terraform module generator
 * Generates complete AKS cluster with virtual network, node pools, and identity
 */

export interface AzureAKSOptions {
  clusterName: string;
  location: string;
  resourceGroupName?: string;
  version?: string;
  nodePoolConfig?: {
    vmSize?: string;
    minCount?: number;
    maxCount?: number;
    initialNodeCount?: number;
  };
  enableAddons?: boolean;
}

export class AzureAKSModuleGenerator {
  /**
   * Generate complete Terraform module for Azure AKS
   */
  static generate(options: AzureAKSOptions): Record<string, string> {
    return {
      'main.tf': this.generateMainTF(options),
      'variables.tf': this.generateVariablesTF(options),
      'outputs.tf': this.generateOutputsTF(options),
      'versions.tf': this.generateVersionsTF(),
      'network.tf': this.generateNetworkTF(options),
    };
  }

  /**
   * Generate main.tf
   */
  private static generateMainTF(options: AzureAKSOptions): string {
    const { clusterName, location, resourceGroupName = `${clusterName}-rg`, version = '1.28', nodePoolConfig = {} } = options;
    const { vmSize = 'Standard_D4s_v3', minCount = 2, maxCount = 10, initialNodeCount = 3 } = nodePoolConfig;

    return `terraform {
  required_version = ">= 1.6"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  backend "azurerm" {
    resource_group_name  = var.backend_resource_group_name
    storage_account_name = var.backend_storage_account_name
    container_name       = "tfstate"
    key                  = "aks/\${var.cluster_name}.tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "odavl-insight"
    ManagedBy   = "terraform"
  }
}

# AKS Cluster
resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = var.cluster_name
  kubernetes_version  = var.kubernetes_version
  sku_tier            = var.sku_tier

  default_node_pool {
    name                = "default"
    vm_size             = "${vmSize}"
    vnet_subnet_id      = azurerm_subnet.aks.id
    enable_auto_scaling = true
    min_count           = ${minCount}
    max_count           = ${maxCount}
    node_count          = ${initialNodeCount}
    os_disk_size_gb     = 128
    os_disk_type        = "Managed"
    type                = "VirtualMachineScaleSets"
    zones               = ["1", "2", "3"]

    upgrade_settings {
      max_surge = "33%"
    }

    node_labels = {
      Environment = var.environment
      NodePool    = "default"
    }

    tags = {
      Environment = var.environment
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin     = "azure"
    network_policy     = "azure"
    load_balancer_sku  = "standard"
    outbound_type      = "loadBalancer"
    service_cidr       = "10.1.0.0/16"
    dns_service_ip     = "10.1.0.10"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  azure_policy_enabled = true
  http_application_routing_enabled = false

  tags = {
    Environment = var.environment
    Name        = var.cluster_name
  }
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "\${var.cluster_name}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = var.environment
  }
}

# Container Insights Solution
resource "azurerm_log_analytics_solution" "container_insights" {
  solution_name         = "ContainerInsights"
  location              = azurerm_resource_group.main.location
  resource_group_name   = azurerm_resource_group.main.name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/ContainerInsights"
  }
}

# Role Assignment - Network Contributor
resource "azurerm_role_assignment" "network_contributor" {
  scope                = azurerm_virtual_network.main.id
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_kubernetes_cluster.main.identity[0].principal_id
}
`;
  }

  /**
   * Generate variables.tf
   */
  private static generateVariablesTF(options: AzureAKSOptions): string {
    const { clusterName, location, resourceGroupName = `${clusterName}-rg`, version = '1.28' } = options;

    return `variable "cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
  default     = "${clusterName}"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "${location}"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "${resourceGroupName}"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "${version}"
}

variable "sku_tier" {
  description = "AKS SKU tier (Free, Standard)"
  type        = string
  default     = "Standard"
}

variable "vnet_cidr" {
  description = "Virtual network CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "aks_subnet_cidr" {
  description = "AKS subnet CIDR"
  type        = string
  default     = "10.0.1.0/24"
}

variable "backend_resource_group_name" {
  description = "Resource group for Terraform backend"
  type        = string
}

variable "backend_storage_account_name" {
  description = "Storage account for Terraform state"
  type        = string
}
`;
  }

  /**
   * Generate outputs.tf
   */
  private static generateOutputsTF(options: AzureAKSOptions): string {
    return `output "cluster_id" {
  description = "AKS cluster ID"
  value       = azurerm_kubernetes_cluster.main.id
}

output "cluster_name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.main.name
}

output "cluster_endpoint" {
  description = "AKS cluster endpoint"
  value       = azurerm_kubernetes_cluster.main.kube_config[0].host
}

output "cluster_ca_certificate" {
  description = "Base64 encoded cluster CA certificate"
  value       = azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate
  sensitive   = true
}

output "kube_config" {
  description = "Kubernetes config"
  value       = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive   = true
}

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

output "virtual_network_id" {
  description = "Virtual network ID"
  value       = azurerm_virtual_network.main.id
}

output "subnet_id" {
  description = "AKS subnet ID"
  value       = azurerm_subnet.aks.id
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = azurerm_log_analytics_workspace.main.id
}

output "identity_principal_id" {
  description = "AKS managed identity principal ID"
  value       = azurerm_kubernetes_cluster.main.identity[0].principal_id
}
`;
  }

  /**
   * Generate versions.tf
   */
  private static generateVersionsTF(): string {
    return `terraform {
  required_version = ">= 1.6"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}
`;
  }

  /**
   * Generate network.tf
   */
  private static generateNetworkTF(options: AzureAKSOptions): string {
    const { clusterName } = options;

    return `# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "\${var.cluster_name}-vnet"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = [var.vnet_cidr]

  tags = {
    Environment = var.environment
  }
}

# Subnet - AKS
resource "azurerm_subnet" "aks" {
  name                 = "\${var.cluster_name}-aks-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.aks_subnet_cidr]
}

# Network Security Group - AKS
resource "azurerm_network_security_group" "aks" {
  name                = "\${var.cluster_name}-aks-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    Environment = var.environment
  }
}

# Subnet NSG Association
resource "azurerm_subnet_network_security_group_association" "aks" {
  subnet_id                 = azurerm_subnet.aks.id
  network_security_group_id = azurerm_network_security_group.aks.id
}

# Public IP for Load Balancer
resource "azurerm_public_ip" "lb" {
  name                = "\${var.cluster_name}-lb-ip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1", "2", "3"]

  tags = {
    Environment = var.environment
  }
}
`;
  }
}
