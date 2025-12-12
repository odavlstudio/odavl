/**
 * @fileoverview GCP GKE Terraform module generator
 * Generates complete GKE cluster with VPC, node pools, and service accounts
 */

export interface GCPGKEOptions {
  clusterName: string;
  region: string;
  project?: string;
  version?: string;
  nodePoolConfig?: {
    machineType?: string;
    minNodeCount?: number;
    maxNodeCount?: number;
    initialNodeCount?: number;
  };
  enableAddons?: boolean;
}

export class GCPGKEModuleGenerator {
  /**
   * Generate complete Terraform module for GCP GKE
   */
  static generate(options: GCPGKEOptions): Record<string, string> {
    return {
      'main.tf': this.generateMainTF(options),
      'variables.tf': this.generateVariablesTF(options),
      'outputs.tf': this.generateOutputsTF(options),
      'versions.tf': this.generateVersionsTF(),
      'network.tf': this.generateNetworkTF(options),
      'iam.tf': this.generateIAMTF(options),
    };
  }

  /**
   * Generate main.tf
   */
  private static generateMainTF(options: GCPGKEOptions): string {
    const { clusterName, region, project = 'your-project-id', version = '1.28', nodePoolConfig = {} } = options;
    const { machineType = 'e2-standard-4', minNodeCount = 2, maxNodeCount = 10, initialNodeCount = 3 } = nodePoolConfig;

    return `terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = var.tf_state_bucket
    prefix = "gke/\${var.cluster_name}"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# GKE Cluster
resource "google_container_cluster" "main" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.main.name
  subnetwork = google_compute_subnetwork.gke.name

  # Vertical Pod Autoscaling
  vertical_pod_autoscaling {
    enabled = true
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "\${var.project_id}.svc.id.goog"
  }

  # Binary Authorization
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  # Add-ons
  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
    network_policy_config {
      disabled = false
    }
    gce_persistent_disk_csi_driver_config {
      enabled = true
    }
  }

  # Network Policy
  network_policy {
    enabled  = true
    provider = "PROVIDER_UNSPECIFIED"
  }

  # Master Auth
  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  # Logging & Monitoring
  logging_service    = "logging.googleapis.com/kubernetes"
  monitoring_service = "monitoring.googleapis.com/kubernetes"

  # Maintenance Window
  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }

  # Release Channel
  release_channel {
    channel = "REGULAR"
  }

  min_master_version = var.kubernetes_version
}

# GKE Node Pool
resource "google_container_node_pool" "main" {
  name       = "\${var.cluster_name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.main.name
  project    = var.project_id
  node_count = ${initialNodeCount}

  autoscaling {
    min_node_count = ${minNodeCount}
    max_node_count = ${maxNodeCount}
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }

  node_config {
    preemptible  = var.use_preemptible_nodes
    machine_type = "${machineType}"
    disk_size_gb = 100
    disk_type    = "pd-standard"

    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    service_account = google_service_account.gke_nodes.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    # Shielded Instance Config
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = {
      environment = var.environment
      node_pool   = "main"
    }

    tags = [var.cluster_name, "gke-node"]

    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}
`;
  }

  /**
   * Generate variables.tf
   */
  private static generateVariablesTF(options: GCPGKEOptions): string {
    const { clusterName, region, project = 'your-project-id', version = '1.28' } = options;

    return `variable "cluster_name" {
  description = "Name of the GKE cluster"
  type        = string
  default     = "${clusterName}"
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "${project}"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "${region}"
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

variable "network_cidr" {
  description = "VPC network CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "GKE subnet CIDR"
  type        = string
  default     = "10.0.1.0/24"
}

variable "pods_cidr" {
  description = "Pods IP range CIDR"
  type        = string
  default     = "10.1.0.0/16"
}

variable "services_cidr" {
  description = "Services IP range CIDR"
  type        = string
  default     = "10.2.0.0/16"
}

variable "use_preemptible_nodes" {
  description = "Use preemptible (spot) instances"
  type        = bool
  default     = false
}

variable "tf_state_bucket" {
  description = "GCS bucket for Terraform state"
  type        = string
}
`;
  }

  /**
   * Generate outputs.tf
   */
  private static generateOutputsTF(options: GCPGKEOptions): string {
    return `output "cluster_id" {
  description = "GKE cluster ID"
  value       = google_container_cluster.main.id
}

output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.main.name
}

output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.main.endpoint
}

output "cluster_ca_certificate" {
  description = "Base64 encoded cluster CA certificate"
  value       = google_container_cluster.main.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "network_name" {
  description = "VPC network name"
  value       = google_compute_network.main.name
}

output "subnet_name" {
  description = "GKE subnet name"
  value       = google_compute_subnetwork.gke.name
}

output "service_account_email" {
  description = "Service account email for GKE nodes"
  value       = google_service_account.gke_nodes.email
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
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}
`;
  }

  /**
   * Generate network.tf
   */
  private static generateNetworkTF(options: GCPGKEOptions): string {
    const { clusterName } = options;

    return `# VPC Network
resource "google_compute_network" "main" {
  name                    = "\${var.cluster_name}-network"
  project                 = var.project_id
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "gke" {
  name          = "\${var.cluster_name}-subnet"
  project       = var.project_id
  region        = var.region
  network       = google_compute_network.main.name
  ip_cidr_range = var.subnet_cidr

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.pods_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.services_cidr
  }

  private_ip_google_access = true
}

# Cloud Router
resource "google_compute_router" "main" {
  name    = "\${var.cluster_name}-router"
  project = var.project_id
  region  = var.region
  network = google_compute_network.main.name
}

# Cloud NAT
resource "google_compute_router_nat" "main" {
  name                               = "\${var.cluster_name}-nat"
  project                            = var.project_id
  region                             = var.region
  router                             = google_compute_router.main.name
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Firewall Rules - Allow internal
resource "google_compute_firewall" "allow_internal" {
  name    = "\${var.cluster_name}-allow-internal"
  project = var.project_id
  network = google_compute_network.main.name

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  source_ranges = [var.network_cidr, var.pods_cidr, var.services_cidr]
}

# Firewall Rules - Allow SSH (for debugging)
resource "google_compute_firewall" "allow_ssh" {
  name    = "\${var.cluster_name}-allow-ssh"
  project = var.project_id
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = [var.cluster_name, "gke-node"]
}
`;
  }

  /**
   * Generate iam.tf
   */
  private static generateIAMTF(options: GCPGKEOptions): string {
    const { clusterName } = options;

    return `# Service Account for GKE Nodes
resource "google_service_account" "gke_nodes" {
  account_id   = "\${var.cluster_name}-nodes"
  display_name = "Service Account for GKE nodes"
  project      = var.project_id
}

# IAM Bindings - Log Writer
resource "google_project_iam_member" "gke_nodes_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:\${google_service_account.gke_nodes.email}"
}

# IAM Bindings - Metric Writer
resource "google_project_iam_member" "gke_nodes_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:\${google_service_account.gke_nodes.email}"
}

# IAM Bindings - Monitoring Viewer
resource "google_project_iam_member" "gke_nodes_monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:\${google_service_account.gke_nodes.email}"
}

# IAM Bindings - Resource Metadata Writer
resource "google_project_iam_member" "gke_nodes_resource_metadata_writer" {
  project = var.project_id
  role    = "roles/stackdriver.resourceMetadata.writer"
  member  = "serviceAccount:\${google_service_account.gke_nodes.email}"
}

# IAM Bindings - Artifact Registry Reader
resource "google_project_iam_member" "gke_nodes_artifact_registry_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:\${google_service_account.gke_nodes.email}"
}
`;
  }
}
