# ODAVL Admin Guide

## Billing Management

### Customer Management
- Access Stripe Dashboard for subscription management
- View customer details, payment history, and usage
- Handle refunds and billing disputes

### Plan Changes
```bash
# Upgrade customer from Pro to Enterprise
# 1. Contact customer to discuss requirements
# 2. Create custom Stripe plan if needed
# 3. Update subscription in Stripe Dashboard
```

### Monitoring & Alerts
- Set up Stripe webhook monitoring
- Configure billing failure notifications
- Monitor monthly recurring revenue (MRR)

## SSO Configuration (Enterprise)

### SAML Setup
1. Obtain IdP metadata from customer
2. Configure SAML_IDP_URL and SAML_ENTITY_ID
3. Generate and exchange certificates
4. Test SSO login flow

### User Provisioning
- Configure automatic user provisioning if supported
- Set up group/role mapping for permissions
- Document customer-specific access controls

## Support Escalation

### Billing Issues
- Refund requests: Review within 30 days
- Payment failures: Check customer card status
- Subscription changes: Coordinate with technical team

### Technical Support
- Enterprise customers: 24/7 dedicated support
- Pro customers: Priority email support (next business day)
- Free tier: Community support only

## Compliance & Legal

### Data Processing Agreement (DPA)
- Enterprise customers require signed DPA
- Store signed agreements securely
- Review annually for compliance updates

### SLA Management
- Enterprise SLA: 99.9% uptime guarantee
- Monitor service availability
- Report SLA breaches to customers