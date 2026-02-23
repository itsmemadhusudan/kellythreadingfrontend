# Pushing ETMS to GitHub

Your project has **two separate GitHub repos**:
- **Backend**: https://github.com/itsmemadhusudan/kallythreadingbackend
- **Frontend**: https://github.com/itsmemadhusudan/kellythreadingfrontend

## Current Status

- **Frontend sync completed** (as of last run): Local frontend was force-pushed to GitHub.
  1. `Add sales images feature with 7-day retention and sales count button`
  2. `Security fixes, optimizations, Remember me, favicon, and sync with upstream repos`

- Your **frontend repo** on GitHub was last updated Feb 21, 2026 with a squashed commit. The local `kellythreadingfrontend/` folder may have newer changes.

## How to Push Frontend to GitHub

Run this from the **etms** project root:

```powershell
git subtree push --prefix=kellythreadingfrontend frontend main
```

If you get conflicts (e.g. because GitHub was force-pushed), you may need to force push:

```powershell
git subtree split -P kellythreadingfrontend -b frontend-split
git push frontend frontend-split:main --force
git branch -D frontend-split
```

## How to Push Backend to GitHub

```powershell
git subtree push --prefix=kallythreadingbackend origin main
```

(Use `master` instead of `main` if your origin default branch is master.)

## Pages Currently in Your App

All these pages exist locally and should be on GitHub after a successful push:

**Admin:** Dashboard, Overview, Vendors, Create Vendor, Branches, Sales, Memberships, Customers, Packages, Search, Leads, Appointments, Settlements, Loyalty, Settings, Profile

**Vendor:** Dashboard, Branches, Sales, Memberships, Customers, Search, Leads, Appointments, Settlements, Loyalty, Profile

**Auth:** Login, Forgot Password, Vendor Pending
