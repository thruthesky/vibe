# End-to-End Test Guide

## Prerequisites

- Deploy completed successfully using the instructions in `specs/deploy.md`.
- The application is reachable at **https://vibers.kr**.

## Test Steps

1. **Open the main site**
   - Navigate to `https://vibers.kr` in a web browser.
2. **Log in**
   - Click the **Log in** button in the header to open the login modal.
   - Click **Sign in with Google Account** (the only sign‑in option).
3. **Access the test login page**
   - After authentication, go to `https://vibers.kr/test/accounts`.
4. **Perform test account login**
   - **Email:** `banana@test.com`
   - **Password:** `12345a,*`
   - Click **Sign In**.
   - You should be redirected to the home page and see the **Log out** button, confirming a successful mock login.
5. **Submit the AI generation prompt**
   - On the home page, locate the prompt input (the text area / input field used for AI generation).
   - Enter the following prompt and submit:
   ```
   Create a simple calculator app
   ```
6. **Wait for generation**
   - The backend will forward the prompt to Gemini, receive a JSON response containing the generated HTML, and store it under `sites/<subdomain>` on the server.
7. **Verify the iframe preview**
   - The right‑hand canvas area should automatically display an `<iframe>` pointing to the generated sub‑domain (e.g. `https://<subdomain>.vibers.kr`).
   - Confirm that the calculator UI loads inside the iframe without errors.
8. **Optional direct check**
   - Open the generated sub‑domain URL in a new browser tab to ensure the app works independently.

## Validation Criteria

- No error message such as _“Sorry, there was an error generating your app.”_
- The iframe loads successfully (HTTP 200) and displays the calculator.
- The calculator performs basic arithmetic (addition/subtraction) as expected.

## Cleanup (optional)

- Click the **Log out** button in the header to end the session.

---

_This test guide must be executed **after** completing the deployment steps described in `specs/deploy.md`._
