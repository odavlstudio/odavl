# ODAVL Pilot Outreach Kit - Usage Guide

## Overview
Complete outreach package for ODAVL Studio pilot program with email sequences and company tracking system.

## Email Templates

### English Sequence (`email_en.md`)
- **Initial Pitch**: Technical value proposition with specific benefits
- **Day 3 Follow-up**: Problem-focused approach with industry customization
- **Day 7 Final**: Urgency-driven with social proof and deadline

### Arabic Sequence (`email_ar.md`)
- **العرض الأولي**: Full Arabic translation with cultural considerations
- **متابعة اليوم الثالث**: Technical discussion adapted for Arabic market
- **متابعة اليوم السابع**: Final approach with regional references

## Personalization Fields
Replace before sending:
- `[CONTACT_NAME]`: Individual recipient name
- `[COMPANY]`: Target company name
- `[INDUSTRY]`: Specific industry (fintech, e-commerce, etc.)
- `[YOUR_NAME]`, `[TITLE]`, `[EMAIL]`, `[PHONE]`: Sender details
- `[DAY_OF_WEEK]`, `[ALTERNATIVE_DAY]`: Specific meeting days
- `[SPECIFIC_TIMES]`: Available time slots
- `[DEADLINE_DATE]`, `[FINAL_SLOTS]`: Urgency elements
- `[DEMO_LINK]`: Link to recorded demonstration

## Company Tracking (`companies.csv`)

### Columns Explained
- **company**: Organization name
- **contact_name**: Primary contact person
- **role**: Contact's job title/function
- **email**: Direct email address
- **region**: Geographic area (North America, Europe, Middle East, Asia Pacific, Latin America)
- **priority**: Sales priority (High/Medium/Low)
- **status**: Current outreach phase (Cold Outreach, Initial Contact, Demo Scheduled, etc.)
- **last_contacted**: Date of most recent interaction (YYYY-MM-DD)
- **notes**: Contextual information, technical requirements, preferences

### Status Workflow
1. **Cold Outreach**: Initial research phase
2. **Initial Contact**: First email sent
3. **Follow-up Sent**: Day 3 or Day 7 follow-up delivered
4. **Demo Requested**: Interest expressed, scheduling in progress
5. **Demo Scheduled**: Meeting confirmed
6. **Demo Completed**: Demonstration finished
7. **Proposal Sent**: Formal pilot proposal delivered
8. **Negotiation**: Contract/terms discussion
9. **Pilot Ready**: Agreement reached, ready to implement
10. **Nurture**: Long-term relationship, not immediate opportunity

### Usage Instructions

#### 1. Campaign Preparation
- Import `companies.csv` into CRM or email platform
- Customize email templates with your specific details
- Set up tracking for open rates, responses, and meeting bookings

#### 2. Segmentation Strategy
- **High Priority**: Enterprise accounts with immediate needs
- **Medium Priority**: Growing companies with planned initiatives  
- **Low Priority**: Long-term relationship building

#### 3. Regional Customization
- **Middle East**: Use Arabic templates, emphasize security/compliance
- **North America**: Focus on ROI and productivity metrics
- **Europe**: Highlight governance and quality standards
- **Asia Pacific**: Emphasize scalability and team efficiency

#### 4. Timing Recommendations
- **Best Days**: Tuesday-Thursday for initial outreach
- **Follow-up Cadence**: Day 3 (problem-focused), Day 7 (final/urgency)
- **Meeting Scheduling**: Offer 2-3 specific time slots
- **Quarter-end Urgency**: Leverage natural procurement cycles

#### 5. Success Metrics
- **Response Rate Target**: 15-25% for initial email
- **Demo Conversion**: 60-80% from positive response to scheduled demo
- **Pilot Conversion**: 40-60% from completed demo to pilot agreement
- **Regional Performance**: Track by geography for optimization

#### 6. Compliance Notes
- Ensure GDPR compliance for European contacts
- Respect opt-out requests immediately
- Maintain accurate contact preferences and communication history
- Follow regional email marketing regulations

## Quick Commands

### Filter High-Priority Prospects
```bash
grep "High" companies.csv | cut -d',' -f1,2,4
```

### Generate Follow-up List (7+ days ago)
Use date comparison to identify contacts needing follow-up based on `last_contacted` field.

### Regional Reporting
```bash
grep "Middle East" companies.csv | wc -l  # Count Middle East prospects
```

## Integration Tips
- Import CSV into Salesforce, HubSpot, or preferred CRM
- Set up automated email sequences using templates
- Configure pipeline stages matching status workflow
- Enable activity tracking for all outreach touchpoints

---
**Best Practice**: Always personalize the industry and specific technical challenges mentioned in emails. Generic pitches have significantly lower response rates than targeted, problem-specific outreach.