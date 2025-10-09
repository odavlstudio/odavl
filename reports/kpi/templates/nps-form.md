# ODAVL Net Promoter Score (NPS) Survey

**Survey for:** {COMPANY_NAME}  
**Pilot Period:** {PILOT_START_DATE} to {PILOT_END_DATE}  
**Survey Date:** {SURVEY_DATE}

## Instructions

Please complete this 2-question survey about your ODAVL pilot experience. Your feedback helps us improve our product and service.

**Privacy Notice:** All responses are stored locally and only shared with your explicit consent. Set `KPI_OPT_IN=true` to enable optional data sharing for product improvement.

## Question 1: Net Promoter Score

**How likely are you to recommend ODAVL to a friend or colleague?**

Please rate on a scale of 0-10, where:
- **0 = Not at all likely**
- **10 = Extremely likely**

**Your Rating:** [ ]

*(Please write a number from 0 to 10)*

## Question 2: Feedback

**What is the primary reason for your score?**

Please provide specific feedback about your ODAVL pilot experience:

```
[Your feedback here - what worked well, what could be improved, 
specific features you liked or disliked, etc.]
```

## Pilot Summary (Optional)

If you'd like to provide additional context, please share:

### Technical Results
- **ESLint warnings reduced:** [ ] (if known)
- **TypeScript errors fixed:** [ ] (if known)
- **Development time saved:** [ ] hours/week (estimated)

### Team Experience
- **Team size:** [ ] developers
- **ODAVL adoption rate:** [ ]% of team used it
- **Integration challenges:** [ ] (none/minor/moderate/significant)

### Business Impact
- **Code review time reduced:** [ ]% (estimated)
- **Bug prevention:** [ ] (none/some/significant)
- **Would purchase:** [ ] (yes/no/maybe)

## Recording Your Response

To record your NPS response in the ODAVL system:

### Option 1: Manual Recording (Recommended)
```bash
# Replace [SCORE] with your 0-10 rating and [FEEDBACK] with your comment
./scripts/kpi/record-event.sh type=nps_response repo={REPO_PATH} \
  notes="Post-pilot NPS survey" \
  metrics='{"score":[SCORE],"feedback":"[FEEDBACK]","pilot_completed":true}'
```

### Option 2: Direct File Append
Add this line to `reports/kpi/events.ndjson`:
```json
{"timestamp":"2025-10-09T10:00:00.000Z","actor":"manual","type":"nps_response","repo":"{REPO_PATH}","notes":"Post-pilot NPS survey","metrics":{"score":[SCORE],"category":"[CATEGORY]","feedback":"[FEEDBACK]","pilot_completed":true}}
```

Replace:
- `[SCORE]` with your 0-10 rating
- `[FEEDBACK]` with your written feedback (escape quotes)
- `[CATEGORY]` with: "detractor" (0-6), "passive" (7-8), or "promoter" (9-10)
- `{REPO_PATH}` with your project repository path

## Follow-Up

Thank you for participating in the ODAVL pilot program! Based on your feedback:

### If you're a Promoter (9-10)
We'd love to feature your success story and discuss our Pro/Enterprise offerings.

### If you're Passive (7-8)  
We'll schedule a follow-up to understand how we can better meet your needs.

### If you're a Detractor (0-6)
We take your feedback seriously and will prioritize addressing your concerns.

**Contact Information:**
- **Support:** support@odavl.studio
- **Sales:** sales@odavl.studio  
- **Product Feedback:** product@odavl.studio

---

*This survey is part of ODAVL's continuous improvement process. All data is handled according to our Privacy Policy and stored locally by default.*