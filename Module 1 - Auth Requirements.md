This is a greenfield Next.js project.
No /src directory - keep all code in the root /app, /lib, etc. directories.
Use TypeScript. 
Use npm as the package manager.
Build a new application just one discrete module at a time. This is Module One, which is User Authentication. 
Each module should be functional and complete on its own, with a clear separation of concerns. 
Make each module as independent as possible from all the other modules in the app.

The first Module will be User Auth: 

User Auth is a UUID + E-mail Address + Password style of Auth. 
Next.js App Router. 
Tailwind for styling.
Supabase for DB and Auth. 
Supabase Auth + server-side session cookies (Next.js App Router) + middleware route protection.
Supabase Redirect URLs include http://localhost:3000/auth/callback and the https://<your-domain>/auth/callback
Password recovery callback → redirect to /reset-password.
All other auth callbacks → redirect to /account.
CSRF protection is implemented using: SameSite cookie settings, and Origin validation for POST requests.
Use @supabase/ssr for server, middleware, and admin Supabase clients. 
Use the Supabase browser client pattern for client-side calls. 
Module One stores identity in Supabase Auth only (auth.users)
Account deletion is implemented server-side using Supabase Admin API (SUPABASE_SERVICE_ROLE_KEY). The service role key must never be exposed to the browser.

Create an auth module that exposes getCurrentUser(), requireUser(), and logout().
Auth logic lives only in /lib/auth/*.
Pages outside /lib/auth/* may call getCurrentUser() and requireUser(), and logout() but must not implement authentication logic directly.
Module One may create/modify only these route files:
/app/page.tsx, 
/app/login/page.tsx, 
/app/signup/page.tsx, 
/app/forgot-password/page.tsx, 
/app/auth/callback/route.ts, 
/app/reset-password/page.tsx, 
/app/account/page.tsx, 
/app/confirm-delete-account/page.tsx, 
/middleware.ts (only if required)

Password policy: min 12 chars, max 72 chars, length-only
Email confirmation: Off by default (can be added later if needed)
URL convention: lowercase hyphenated routes
Delete account confirmation: requires password re-entry on confirm page (no freshness window needed)

This Module One will result in the following pages being created. (Num 0-6)

0 - Start Page (/)

This page is the unauthenticated entry point to the app and presents login and account creation options.
It is shown when:
A visitor navigates to the root URL.
A user returns to the site without an active session.
It must handle these scenarios:
- Visitor not authenticated → display “Log in” and “Sign up” actions.
- Visitor clicks “Log in” → route to /login.
- Visitor clicks “Sign up” → route to /signup.
- Visitor is authenticated → redirect to /account (or the primary authenticated route).

1 - Sign Up (/signup)

This page creates a new user account using email and password.
It is shown when:
A visitor clicks “Create account.”
An unauthenticated user attempts to access a protected route and does not have an account.
A user on the Login page selects “Create account.”
It must handle these scenarios:
- Email already exists → display: “An account with this email already exists. Please log in.”
- User wishes to unhide the password user has typed (UI behavior)
- Confirm Password does not match Password (UI behavior)
- Account creation succeeds → create user record and start authenticated session → redirect to /account.
- Backend or network failure → display generic error without exposing system details.

2 - Log In (/login)

This page authenticates an existing user.
It is shown when:
A visitor clicks “Log in.”
An unauthenticated user attempts to access a protected route.
A session has expired.
A user logs out.
A password reset has just completed.
It must handle these scenarios:
- User wishes to unhide the password user has typed (UI behavior)
- Email does not exist → display: “Invalid email or password.”
- Password incorrect → display: “Invalid email or password.”
- Excessive failed login attempts may be rate-limited by Supabase → display the error returned by Supabase.
- No custom per-account lockout is implemented in Module One.
- Successful authentication → create session and redirect to /account.
- Backend or network failure → display generic error.

3 - Forgot Password (/forgot-password)

This page initiates a password reset request.
It is shown when:
A user selects “Forgot password?” from the Login page.
It must handle these scenarios:
- Email submitted → always display: “If an account exists for this email, a reset link has been sent.”
- Rate limit triggered → display rate limit message.
- Mail service failure → display generic error.
- This page must not reveal whether the email exists in the system.

4 - Reset Password (/reset-password)

This page sets a new password using a valid reset token.
It is shown when:
A user clicks a password reset link containing a valid reset token.
It must handle these scenarios:
- Token invalid → display: “Invalid or expired reset link.”
- Token expired → display: “Reset link has expired. Request a new one.”
- User enters new password and confirmation → passwords must match and meet policy requirements.
- Successful password update → invalidate reset token (single-use) → sign out current session → redirect to /login.
- User wishes to unhide the password user has typed (UI behavior)
- Backend failure → display generic error.

5 - Account Page (/account)

This page displays authenticated user information and provides logout functionality.
It is shown when:
An authenticated user navigates to /account.
A user successfully logs in and is redirected.
It must handle these scenarios:
- User not authenticated → redirect to /login.
- Session expired → redirect to /login.
- User selects logout → call logout() (Server Action) → redirect to /login.
- User clicks "Delete Account" → redirect to /confirm-delete-account.

6 - Confirm Delete (/confirm-delete-account)

This page confirms the user decision to permanently delete their account.
It is shown when:
A user clicks "Delete Account" from the /account Page.
It must handle these scenarios:
- This page is protected by requireUser().
- User not authenticated → redirect to /login.
- Warning text must explain deletion is permanent and cannot be undone.
- User must re-enter password.
- User must confirm decision (example: click checkbox "Yes, Delete My Account").
- Password incorrect → display: “Invalid password.”
- Checkbox not checked → display: “You must confirm account deletion.”
- Module One deletes the Supabase Auth user. No other domain data exists in Module One.
- Successful deletion → terminate session → delete Supabase Auth user using Admin API → redirect to /?message=Account-Deleted
- Backend failure → display generic error.


Rejected Options:
No confirmation email with magic link for login (passwordless)
No block common passwords (example: "password123") - this can be added later if needed but for now we will just have a length requirement.
No 2FA/MFA (example: TOTP, SMS, or email codes) - this can be added later if needed but for now we will just have email+password.
No social logins (example: Google, Facebook, Twitter) - this can be added later if needed but for now we will just have email+password.
Do not introduce additional authentication libraries (NextAuth/Auth.js/Clerk/etc.). Use Supabase Auth only.
Do not implement Stripe or any subscription logic.
No user profile table or additional user data beyond what is stored in Supabase Auth. This can be added later if needed but for now we will just have email+password auth with no additional profile data.
Do not implement a toast/notification system. Use a ?message= query param for post-redirect messages (example: /?message=account-deleted) and display it on the destination page.
Do not implement an auth context provider or useAuth() hook. getCurrentUser() and requireUser() are server-side. Client components receive user data via props.
Do not create shared form components for Module One (no <AuthForm>, <PasswordInput>, <EmailInput>). Each page implements its own simple form inline.
Do not build complex middleware route matching (no route arrays, role checks, redirect maps). Module One protects only /account and /confirm-delete-account using simple checks.
Do not create a shared password validation utility module. Inline password.length >= 12 && password.length <= 72 where needed.
Do not implement an error boundary or shared error handling abstraction. Each page uses local state for a single error message.
Do not implement loading skeletons or Suspense boundaries. Disable the submit button during submission.
Do not create more Supabase client factory files than necessary. This Module One uses exactly three Supabase clients: (browser client, server client, admin server client (service role)) 
Do not implement custom token handling.