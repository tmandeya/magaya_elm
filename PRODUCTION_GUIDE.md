# Magaya ELMS — Production Deployment Guide
## Step-by-Step (Like You're a Beginner)

---

## WHAT WE'RE BUILDING

```
Your Computer → GitHub → Vercel (Live Website)
                     ↓
              Supabase (Database + Login + Files)
```

| Service | What It Does | Your Link |
|---------|-------------|-----------|
| **GitHub** | Stores your code | https://github.com/tmandeya/magaya_elm |
| **Supabase** | Database, user login, file storage | https://supabase.com/dashboard/project/sgtnrvfnyyfnklobcpkm |
| **Vercel** | Hosts your website live | https://vercel.com |

---

## BEFORE YOU START

Make sure you have these installed:

1. **Node.js** — Check by opening terminal and typing:
   ```bash
   node -v
   ```
   Should show something like `v20.x.x`. If not, download from https://nodejs.org

2. **Git** — Check by typing:
   ```bash
   git --version
   ```
   Should show something like `git version 2.x.x`. If not, download from https://git-scm.com

---

## STEP 1: PUSH CODE TO GITHUB

**Why:** We need your code on GitHub so Vercel can grab it and deploy it automatically.

### 1.1 Open a Terminal
- **Windows:** Press `Win + R`, type `cmd`, press Enter
- **Mac:** Press `Cmd + Space`, type `Terminal`, press Enter

### 1.2 Go to your project folder
```bash
cd /mnt/agents/output/app
```

### 1.3 Set up Git to point to YOUR repo
Run these commands one by one:

```bash
# Remove old remote (if any)
git remote remove origin 2>/dev/null; true

# Add YOUR GitHub repo
git remote add origin https://github.com/tmandeya/magaya_elm.git

# Set branch name
git branch -M main

# Push everything
git push -u origin main --force
```

**If it asks for a password:** Use a **Personal Access Token**, not your password.
- Go to https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Check the `repo` box
- Click "Generate token"
- Copy the token and paste it as your password

### 1.4 Verify it worked
Go to https://github.com/tmandeya/magaya_elm in your browser. You should see all your code files there.

---

## STEP 2: SET UP SUPABASE DATABASE

**Why:** Supabase is where ALL your data lives — employees, workflows, files, everything.

### 2.1 Open your Supabase project
Go to: https://supabase.com/dashboard/project/sgtnrvfnyyfnklobcpkm

### 2.2 Run the Database Schema

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"**
3. Open the file `/mnt/agents/output/supabase_schema.sql` on your computer (or copy its contents)
4. Paste ALL of it into the SQL Editor
5. Click **"Run"**
6. Wait for it to finish (should say "Success" in green)

**What this does:**
- Creates all 11 tables (sites, departments, employees, workflows, stages, checklists, audit logs, notifications, etc.)
- Inserts all 11 Magaya sites
- Inserts 12 departments
- Inserts 25 sample employees with realistic Zimbabwean names
- Sets up security rules (RLS policies)
- Creates indexes for speed
- Sets up automatic audit logging triggers

### 2.3 Create Storage Buckets (for file uploads)

1. In the left sidebar, click **"Storage"**
2. Click **"New Bucket"**
3. Name: `employee-photos`
4. Uncheck "Public bucket" (keep it private)
5. Click **"Save"**
6. Click **"New Bucket"** again
7. Name: `employee-documents`
8. Uncheck "Public bucket"
9. Click **"Save"**

### 2.4 Set up Storage Policies

For each bucket (`employee-photos` and `employee-documents`):

1. Click on the bucket name
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Select **"For full customization"**
5. Paste this policy:

```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'employee-photos');

CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'employee-photos');
```

(Replace `employee-photos` with `employee-documents` for the second bucket)

### 2.5 Get your Supabase credentials

1. In the left sidebar, click **"Project Settings"** (gear icon at bottom)
2. Click **"API"**
3. Copy these two values:
   - **Project URL** (looks like `https://sgtnrvfnyyfnklobcpkm.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

**Keep these safe — you'll need them in Step 4.**

---

## STEP 3: ADD SUPABASE TO YOUR PROJECT

### 3.1 Install the Supabase JavaScript library

In your terminal (in the project folder):

```bash
cd /mnt/agents/output/app
npm install @supabase/supabase-js
```

### 3.2 Create the Supabase client file

Create a new file: `src/lib/supabase.ts`

Copy the ENTIRE contents from `/mnt/agents/output/supabase-client.ts` into this file.

### 3.3 Create your environment file

In your project folder, create a file named `.env`:

```bash
cp /mnt/agents/output/.env.example /mnt/agents/output/app/.env
```

Then edit `.env` and fill in your actual Supabase values:

```env
VITE_SUPABASE_URL=https://sgtnrvfnyyfnklobcpkm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (your actual key)
```

**IMPORTANT:** The `.env` file should NEVER be committed to GitHub. It should already be in your `.gitignore` file.

### 3.4 Make Vite load env variables

Your `vite.config.ts` should already handle this, but verify it has this line in the config:

```typescript
export default defineConfig({
  // ... other config
  envPrefix: 'VITE_', // This tells Vite to expose env vars starting with VITE_
});
```

### 3.5 Commit the Supabase integration

```bash
cd /mnt/agents/output/app
git add src/lib/supabase.ts package.json package-lock.json .env
git commit -m "Add Supabase client integration"
git push origin main
```

---

## STEP 4: CONNECT FRONTEND TO REAL DATA

Right now your app uses fake/mock data. We need to replace it with real Supabase calls.

### 4.1 Replace the mock data hook

Open `src/hooks/useAuth.tsx` and update it to use Supabase auth:

```typescript
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, getCurrentUser, getSession } from '@/lib/supabase';
import type { UserRole } from '@/types';

interface AuthContextType {
  user: any;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  setRole: (role: UserRole) => void;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentRole: null,
  isAuthenticated: false,
  setRole: () => {},
  login: async () => ({ error: null }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Check for existing session on load
    getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const role = session.user.user_metadata?.role as UserRole;
        setCurrentRole(role || 'hq_hr');
      }
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const role = session.user.user_metadata?.role as UserRole;
        setCurrentRole(role || 'hq_hr');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentRole(null);
      }
    });

    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      setUser(data.user);
      const role = data.user.user_metadata?.role as UserRole;
      setCurrentRole(role || 'hq_hr');
    }
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentRole(null);
  };

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentRole,
      isAuthenticated: !!user || !!currentRole, // Allow mock mode too
      setRole,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 4.2 Create a data fetching hook for employees

Create `src/hooks/useEmployees.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getEmployees, getEmployeeById, createEmployee, updateEmployee } from '@/lib/supabase';

export function useEmployees(filters?: any) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getEmployees(filters);
    if (error) setError(error);
    else setEmployees(data || []);
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { employees, loading, error, refetch: fetchEmployees };
}

export function useEmployee(id: string) {
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    getEmployeeById(id).then(({ data, error }) => {
      if (error) setError(error);
      else setEmployee(data);
      setLoading(false);
    });
  }, [id]);

  return { employee, loading, error };
}
```

### 4.3 Create a data fetching hook for workflows

Create `src/hooks/useWorkflows.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getWorkflows, getWorkflowById } from '@/lib/supabase';

export function useWorkflows(filters?: any) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getWorkflows(filters);
    if (error) setError(error);
    else setWorkflows(data || []);
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return { workflows, loading, error, refetch: fetchWorkflows };
}

export function useWorkflow(id: string) {
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getWorkflowById(id).then(({ data }) => {
      setWorkflow(data);
      setLoading(false);
    });
  }, [id]);

  return { workflow, loading };
}
```

### 4.4 Gradual migration strategy

**DON'T replace everything at once.** Do it page by page:

1. **Start with the Employees list page** — replace the mock data with `useEmployees()`
2. **Then the Employee Profile** — use `useEmployee(id)`
3. **Then Workflows** — use `useWorkflows()` and `useWorkflow(id)`
4. **Keep mock data as fallback** until each page is fully working

**Example of how to replace in a page:**

```typescript
// BEFORE (mock):
import { employees } from '@/data/mockData';

// AFTER (Supabase):
import { useEmployees } from '@/hooks/useEmployees';

function EmployeesPage() {
  const { employees, loading, error } = useEmployees();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <table>
      {employees.map(emp => (
        <tr key={emp.id}>
          <td>{emp.employee_code}</td>
          <td>{emp.full_name}</td>
          <td>{emp.site?.name}</td>
        </tr>
      ))}
    </table>
  );
}
```

---

## STEP 5: DEPLOY TO VERCEL

**Why:** This makes your website live on the internet.

### 5.1 Connect GitHub to Vercel

1. Go to https://vercel.com and log in
2. Click **"Add New Project"**
3. Under "Import Git Repository", find `tmandeya/magaya_elm`
4. Click **"Import"**

### 5.2 Configure the project

On the project setup page:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `./` (leave as is) |
| **Build Command** | `npm run build` (should auto-detect) |
| **Output Directory** | `dist` (should auto-detect) |

### 5.3 Add Environment Variables

Click **"Environment Variables"** and add these:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://sgtnrvfnyyfnklobcpkm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (your actual anon key) |

### 5.4 Deploy!

Click **"Deploy"**

Wait 2-3 minutes for the build to complete.

### 5.5 Your live URL

Once deployed, Vercel will give you a URL like:
`https://magaya-elm.vercel.app`

You can also set up a custom domain later (like `elms.magayamining.com`).

### 5.6 Auto-deploy on every push

**Magic:** Every time you push code to GitHub, Vercel will automatically rebuild and redeploy. No manual steps needed!

---

## STEP 6: SET UP SUPABASE AUTH (LOGIN SYSTEM)

### 6.1 Enable Email Auth

1. In Supabase dashboard, click **"Authentication"** in left sidebar
2. Click **"Providers"**
3. Make sure **"Email"** is enabled
4. Set these options:
   - **Confirm email:** OFF (for now, to make testing easier)
   - **Secure email change:** ON
   - **Max 1 account per email:** ON

### 6.2 Create your first admin user

1. In Supabase dashboard, click **"Authentication"** → **"Users"**
2. Click **"Add User"** (or "Invite User")
3. Enter your email: `tatenda.mandeya@magayamining.com`
4. Set a password
5. Click **"Create User"**

### 6.3 Set the user's role

1. In the Users list, click on your new user
2. Click **"Edit User Metadata"**
3. Add this JSON:

```json
{
  "role": "hq_hr",
  "site_id": null,
  "full_name": "Tatenda Mandeya"
}
```

### 6.4 Test login

Go to your live Vercel URL and try logging in with your email and password.

---

## STEP 7: VERIFY EVERYTHING WORKS

### Checklist:

- [ ] GitHub repo has all code: https://github.com/tmandeya/magaya_elm
- [ ] Supabase tables created: Go to Supabase → Table Editor → see all tables
- [ ] Sample data loaded: Check employees table has 25 records
- [ ] Vercel site loads: Visit your Vercel URL
- [ ] Login works: Sign in with your admin account
- [ ] Employee list loads from database (not mock data)

### If something doesn't work:

1. **Check Vercel build logs:** Go to Vercel dashboard → your project → "Deployments" → click latest → "Build Logs"
2. **Check browser console:** Press F12 → Console tab → look for red errors
3. **Check Supabase logs:** Supabase dashboard → "Logs" → "API"

---

## NEXT: FLOW ADJUSTMENTS

Once the production setup is working, you mentioned wanting to make flow adjustments. Here are the most common ones and how to implement them:

### Adding a New Workflow Stage

1. Update the `workflow_stages` table (via SQL or Supabase UI)
2. Update the `total_stages` in `workflows` table
3. Update the frontend progress bar component

### Adding a New Approval Role

1. Add the role to the `site_personnel` table
2. Update the `role_type` CHECK constraint
3. Add the role to the frontend role selector
4. Update RLS policies if needed

### Custom Email Notifications

Supabase has built-in email triggers. Add this SQL:

```sql
-- Auto-create notification when workflow stage changes
CREATE OR REPLACE FUNCTION notify_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, type, title, message, related_workflow_id)
  SELECT 
    sp.employee_id,
    'sign_off_required',
    'Action Required: ' || NEW.stage_name,
    'You have been assigned to review ' || NEW.stage_name,
    NEW.workflow_id
  FROM site_personnel sp
  WHERE sp.site_id = (SELECT site_id FROM workflows WHERE id = NEW.workflow_id)
  AND sp.role_type = NEW.department;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stage_change_notification
  AFTER UPDATE ON workflow_stages
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'in_progress')
  EXECUTE FUNCTION notify_stage_change();
```

---

## FILES YOU NEED

| File | Location | Purpose |
|------|----------|---------|
| **Database Schema** | `/mnt/agents/output/supabase_schema.sql` | Run this in Supabase SQL Editor |
| **Supabase Client** | `/mnt/agents/output/supabase-client.ts` | Copy to `src/lib/supabase.ts` |
| **Environment Template** | `/mnt/agents/output/.env.example` | Copy to `.env`, fill in your values |
| **This Guide** | `/mnt/agents/output/PRODUCTION_GUIDE.md` | Keep for reference |

---

## SUPPORT

If you get stuck on any step:
1. Check the error message carefully — it usually tells you exactly what's wrong
2. Check browser console (F12) for frontend errors
3. Check Vercel build logs for deployment errors
4. Check Supabase logs for database errors

**Now start with Step 1 and work your way down!**
