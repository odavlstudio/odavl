/**
 * GDPR Data Management Components
 *
 * Provides users with GDPR rights:
 * - Right to Access (data export)
 * - Right to Erasure (account deletion)
 * - Right to Portability (JSON export)
 *
 * Compliant with GDPR Article 15, 17, 20
 *
 * @see docs/legal/PRIVACY_POLICY.md
 */

"use client";

import { useState } from "react";
import { Download, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * GDPR Data Export Component
 * Allows users to download all their personal data (Article 15 - Right to Access)
 */
export function DataExportSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("idle");

    try {
      const response = await fetch("/api/gdpr/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `odavl-data-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportStatus("success");
    } catch (error) {
      console.error("Data export failed:", error);
      setExportStatus("error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Download className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Download Your Data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Export all your personal data in JSON format. This includes your profile, workspaces,
            error signatures, and usage history.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            <strong>GDPR Right:</strong> Article 15 - Right to Access
          </p>
        </div>
      </div>

      {exportStatus === "success" && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Data exported successfully! Check your downloads folder.</span>
        </div>
      )}

      {exportStatus === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Export failed. Please try again or contact support.</span>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
      >
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export My Data"}
      </button>
    </div>
  );
}

/**
 * GDPR Account Deletion Component
 * Allows users to permanently delete their account (Article 17 - Right to Erasure)
 */
export function AccountDeletionSection() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "success" | "error">("idle");

  const handleDelete = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      alert('Please type "DELETE MY ACCOUNT" to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteStatus("idle");

    try {
      const response = await fetch("/api/gdpr/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: confirmText }),
      });

      if (!response.ok) {
        throw new Error("Deletion failed");
      }

      setDeleteStatus("success");

      // Redirect to goodbye page after 3 seconds
      setTimeout(() => {
        window.location.href = "/goodbye";
      }, 3000);
    } catch (error) {
      console.error("Account deletion failed:", error);
      setDeleteStatus("error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 space-y-4 bg-red-50/50 dark:bg-red-900/10">
      <div className="flex items-start gap-3">
        <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Your Account
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Permanently delete your account and all associated data. This action{" "}
            <strong>cannot be undone</strong>.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            <strong>GDPR Right:</strong> Article 17 - Right to Erasure ("Right to be Forgotten")
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-semibold">What will be deleted:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your profile and account information</li>
              <li>All workspaces and projects</li>
              <li>Error signatures and analysis history</li>
              <li>Autopilot recipes and trust scores</li>
              <li>Guardian test results</li>
              <li>Subscriptions (will be cancelled)</li>
            </ul>
            <p className="mt-2 font-semibold">What will be retained:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Anonymized, aggregated analytics (required for ML training)</li>
              <li>Transaction records (required by tax law for 7 years)</li>
            </ul>
          </div>
        </div>
      </div>

      {deleteStatus === "success" && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Account scheduled for deletion. Redirecting...</span>
        </div>
      )}

      {deleteStatus === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Deletion failed. Please contact support@odavl.studio</span>
        </div>
      )}

      {!showConfirmation ? (
        <button
          onClick={() => setShowConfirmation(true)}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete My Account
        </button>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-red-600 dark:text-red-400">DELETE MY ACCOUNT</code> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== "DELETE MY ACCOUNT"}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {isDeleting ? "Deleting..." : "Confirm Deletion"}
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmText("");
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * GDPR Privacy Dashboard
 * Complete privacy management page
 */
export function GDPRPrivacyDashboard() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Privacy & Data Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your data and privacy settings in compliance with GDPR, CCPA, and other privacy laws.
        </p>
      </div>

      <DataExportSection />
      <AccountDeletionSection />

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Your Privacy Rights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white">Right to Access</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Download all your personal data at any time.
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white">Right to Erasure</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Permanently delete your account and data.
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white">Right to Portability</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Export your data in machine-readable format (JSON).
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white">Right to Object</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage cookie preferences and marketing consent.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Questions? Contact{" "}
        <a href="mailto:privacy@odavl.studio" className="text-blue-600 dark:text-blue-400 underline">
          privacy@odavl.studio
        </a>
      </div>
    </div>
  );
}
