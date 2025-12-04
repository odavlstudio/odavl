'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookDelivery {
  id: string;
  event: string;
  status: 'pending' | 'success' | 'failed';
  attemptCount: number;
  deliveredAt?: string;
  failedAt?: string;
  error?: string;
}

interface AvailableEvent {
  key: string;
  description: string;
}

export default function WebhooksPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [organization, setOrganization] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Record<string, AvailableEvent[]>>({});
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
  });

  useEffect(() => {
    fetchOrganization();
    fetchAvailableEvents();
  }, [orgSlug]);

  useEffect(() => {
    if (organization) {
      fetchWebhooks();
    }
  }, [organization]);

  useEffect(() => {
    if (selectedWebhook) {
      fetchDeliveries(selectedWebhook.id);
    }
  }, [selectedWebhook]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/v1/organizations');
      const data = await response.json();
      const org = data.data.find((o: any) => o.slug === orgSlug);
      setOrganization(org);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    }
  };

  const fetchWebhooks = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/organizations/${organization.id}/webhooks`);
      const data = await response.json();

      if (data.success) {
        setWebhooks(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEvents = async () => {
    try {
      const response = await fetch('/api/v1/webhooks/events');
      const data = await response.json();

      if (data.success) {
        setAvailableEvents(data.data.grouped);
      }
    } catch (error) {
      console.error('Failed to fetch available events:', error);
    }
  };

  const fetchDeliveries = async (webhookId: string) => {
    if (!organization) return;

    try {
      const response = await fetch(
        `/api/v1/organizations/${organization.id}/webhooks/${webhookId}/deliveries?limit=20`
      );
      const data = await response.json();

      if (data.success) {
        setDeliveries(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    }
  };

  const handleCreateWebhook = async () => {
    if (!organization) return;

    try {
      const response = await fetch(`/api/v1/organizations/${organization.id}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setFormData({ url: '', events: [] });
        fetchWebhooks();
        alert('Webhook created successfully!');
      } else {
        alert('Failed to create webhook: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
      alert('Failed to create webhook');
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    if (!organization) return;

    try {
      const response = await fetch(
        `/api/v1/organizations/${organization.id}/webhooks/${webhookId}/test`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.success) {
        alert(`Webhook test successful! Status: ${data.data.status}`);
      } else {
        alert(`Webhook test failed: ${data.data.error}`);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to test webhook');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!organization || !confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/organizations/${organization.id}/webhooks/${webhookId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        fetchWebhooks();
        setSelectedWebhook(null);
        alert('Webhook deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook');
    }
  };

  const toggleEvent = (eventKey: string) => {
    setFormData({
      ...formData,
      events: formData.events.includes(eventKey)
        ? formData.events.filter((e) => e !== eventKey)
        : [...formData.events, eventKey],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
            <p className="text-gray-600 mt-2">
              Receive real-time notifications about events in your organization
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Webhook
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Webhooks List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Configured Webhooks</h2>
            </div>
            <div className="divide-y">
              {webhooks.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No webhooks configured yet
                </div>
              ) : (
                webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedWebhook?.id === webhook.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedWebhook(webhook)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {webhook.url}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {webhook.events.length} events • Created{' '}
                          {new Date(webhook.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            webhook.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {webhook.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Webhook Details / Deliveries */}
          <div className="bg-white rounded-lg shadow">
            {selectedWebhook ? (
              <>
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">Webhook Details</h2>
                      <p className="text-sm text-gray-500 mt-1 break-all">
                        {selectedWebhook.url}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteWebhook(selectedWebhook.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mt-4 space-x-2">
                    <button
                      onClick={() => handleTestWebhook(selectedWebhook.id)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                    >
                      Test Webhook
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-semibold mb-2">Subscribed Events</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedWebhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {event}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-semibold mb-2">Recent Deliveries</h3>
                  <div className="space-y-2">
                    {deliveries.length === 0 ? (
                      <p className="text-gray-500 text-sm">No deliveries yet</p>
                    ) : (
                      deliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          className="p-3 border rounded-lg text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{delivery.event}</span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                delivery.status === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : delivery.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {delivery.status}
                            </span>
                          </div>
                          <p className="text-gray-500 mt-1">
                            {delivery.deliveredAt
                              ? new Date(delivery.deliveredAt).toLocaleString()
                              : delivery.failedAt
                              ? new Date(delivery.failedAt).toLocaleString()
                              : 'Pending'}
                          </p>
                          {delivery.error && (
                            <p className="text-red-600 text-xs mt-1">
                              {delivery.error}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Select a webhook to view details
              </div>
            )}
          </div>
        </div>

        {/* Create Webhook Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">Create Webhook</h2>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block font-medium mb-2">Payload URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://example.com/webhook"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    HTTPS endpoint to receive webhook payloads
                  </p>
                </div>

                <div>
                  <label className="block font-medium mb-2">
                    Select Events ({formData.events.length} selected)
                  </label>
                  <div className="space-y-4">
                    {Object.entries(availableEvents).map(([category, events]) => (
                      <div key={category}>
                        <h3 className="font-medium text-sm text-gray-700 mb-2 capitalize">
                          {category} Events
                        </h3>
                        <div className="space-y-2">
                          {events.map((event) => (
                            <label
                              key={event.key}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.events.includes(event.key)}
                                onChange={() => toggleEvent(event.key)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm">
                                <span className="font-medium">{event.key}</span>
                                <span className="text-gray-500">
                                  {' '}
                                  - {event.description}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ url: '', events: [] });
                  }}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  disabled={!formData.url || formData.events.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Webhook
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
