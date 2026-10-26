# Reporting a security concern

EMPIRE OS is a private product in development. No public bug-bounty program, response-time guarantee or verified security-reporting mailbox is configured.

If you already have repository access, contact the owner through your existing private channel. If GitHub offers **Security → Report a vulnerability** for this repository, use that private flow. Do not open a normal issue containing a working exploit against real users, secret values or personal information.

Include the affected route or source file, the expected and observed behavior, and minimal steps using fictional test accounts. State the commit/version and whether this occurred in local test mode or a live environment. Remove auth cookies, API keys, invitation tokens, payment signatures, email addresses and journal text from logs and screenshots.

Stop after demonstrating the issue with data you are authorized to use. Coordinate any live verification with the owner; do not access another student's or college's data to strengthen a report.

The owner should acknowledge the finding privately, reproduce it in a safe environment, correct the affected boundary and add a focused regression check where appropriate. Secret rotation and incident handling belong in the provider/operator workflow, never in a public thread.

For the implemented model and remaining launch checks, read [docs/SECURITY.md](docs/SECURITY.md), [operations](docs/OPERATIONS.md) and the [launch checklist](docs/LAUNCH_CHECKLIST.md).
