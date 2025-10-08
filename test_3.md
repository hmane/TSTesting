Legal Review System - Project Timeline
Phase 1: Communication Requests
Current Date: October 8, 2025
Go-Live Target: December 17, 2025
Total Duration: 10 weeks

Project Status
✅ Completed:

Requirements gathering and validation
Repository, SharePoint site, and PnP schema setup
CI/CD pipelines configured
Development environment ready


Development Timeline
📅 Sprint 1-3: Request Form Development
Duration: October 8 - October 31, 2025 (3.5 weeks)
Deliverables:

Complete request form with all components:

Request Information Card (type, title, purpose, dates, approvals)
Approvals Card (all 6 approval types)
Document Upload Component
Legal Intake Card
Legal Review Card
Compliance Review Card
Closeout Card


Form validation (Zod schemas)
Zustand store integration
RequestContainer layout (70/30 split)
WorkflowStepper component
First UAT deployment (small features ship to UAT for early feedback)


📅 Sprint 4-5: Edit Functionality & Complete Workflow
Duration: November 3 - November 15, 2025 (2 weeks)
Deliverables:

Edit mode implementation
All workflow transitions:

Draft → Legal Intake → Assign Attorney/In Review → Closeout → Completed
Special actions (Cancel, Hold, Resume)


Azure Functions:

Permission management endpoint
Notification generation endpoint


Item-level permissions (break inheritance)
End-to-end workflow testing
Comments integration (PnP)
Continuous UAT deployments (features ship as ready)


📅 Sprint 6-7: Dashboards & Notifications
Duration: November 17 - November 30, 2025 (2 weeks)
Deliverables:

Role-based dashboards (5 views):

Submitter Dashboard
Legal Admin Dashboard
Attorney Dashboard
Compliance Dashboard
Attorney Assigner Dashboard


Filter, search, and sort functionality
Power Automate Flows (3 flows):

Request Status Change
Comment Added
Document Uploaded


All 15 notification types implemented
All features available in UAT


🧪 UAT Phase
Duration: December 2 - December 13, 2025 (2 weeks)
Week 1 (Dec 2-8):

UAT kickoff and training
Basic workflow testing
Daily bug fixes and regression testing

Week 2 (Dec 9-13):

Advanced workflow testing
Edge case validation
Performance and security verification
UAT sign-off (Dec 13)

UAT Team: 2-3 Submitters, 2 Legal Admins, 1 Attorney Assigner, 2 Attorneys, 1 Compliance User
Note: Early and continuous UAT deployments (starting Oct 31) will significantly reduce surprises during formal UAT.

🚢 Production Rollout
Duration: December 16 - 20, 2025 (1 week)
December 16 (Monday):

Pre-production checklist
Azure Functions and Power Automate deployment
Production environment validation

December 17 (Tuesday) - GO-LIVE:

SPFx solution deployment
Smoke testing
Go-Live announcement (5:00 PM)

December 18-20 (Wed-Fri):

Hypercare support (extended hours: 7 AM - 7 PM)
Real-time monitoring
Quick issue resolution


📊 Post-Go-Live
Duration: December 23, 2025 - January 17, 2026 (4 weeks)
Week 1-2 (Dec 23 - Jan 3):

Holiday period - monitored support
Feedback collection
Minor bug fixes

Week 3 (Jan 6-10):

Support team handoff
Knowledge transfer

Week 4 (Jan 13-17):

Project closure
Lessons learned
Final metrics report
Phase 1 Complete 🎉


Key Milestones
MilestoneDateStatusRequirements & Setup CompleteOct 7, 2025✅ CompleteRequest Form Complete + First UATOct 31, 2025🚀 In ProgressEdit & Workflow CompleteNov 15, 2025🎯 TargetDashboards & Notifications CompleteNov 30, 2025🎯 TargetUAT Sign-offDec 13, 2025🎯 TargetProduction GO-LIVEDec 17, 2025🎯 TargetPhase 1 CompleteJan 17, 2026🎯 Target

Resource Allocation
Development Team: 6 developers working in parallel streams

3 Frontend developers (UI components)
2 Backend/Integration developers (Azure Functions, Power Automate)
1 QA/Testing developer

Support Team:

Project Manager (full-time)
Business Analyst (part-time)
QA Engineer (full-time from Week 3.5)
SharePoint Admin (part-time)


Success Criteria
By January 17, 2026:

✅ 90% user adoption within first month
✅ 100% of communication requests through system (no emails)
✅ <3 second page load time
✅ Complete audit trail for all requests
✅ User satisfaction score 4.0+/5.0
✅ All documentation complete


Phase 2 Planning
Discussion Begins: Early December 2025 (during UAT)
Scope: General Review and IMA Review request types
Estimated Timeline: Q1-Q2 2026

Key Strategy Advantages

✅ Early UAT deployment (Oct 31) - Continuous feedback loop reduces formal UAT risks
✅ Multiple developers - Parallel stream development accelerates delivery
✅ 2-week UAT - Sufficient due to ongoing UAT exposure since October 31
✅ Pre-holiday go-live - System operational before year-end
✅ Phased approach - Phase 1 success informs Phase 2 planning


Communication

Daily Standups: 9:00 AM (development team)
Sprint Reviews: Every 2 weeks (stakeholders + team)
Weekly Status: Email to stakeholders
UAT Daily Check-ins: 30 minutes (Dec 2-13)
Go-Live Announcement: Dec 17, 5:00 PM
