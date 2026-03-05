import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { APP_NAME } from "./config";
import { getSession, setStoredToken, signOut, supabase, syncSessionFromUrlHash } from "./lib/auth";
import { getDisplayName, getInitials } from "./lib/utils";
import StudyPage from "./pages/StudyPage";
import QuizPage from "./pages/QuizPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await syncSessionFromUrlHash();
        const currentSession = await getSession();
        if (mounted) {
          setSession(currentSession);
        }
      } catch (sessionError) {
        if (mounted) {
          setError(sessionError.message || "Failed to load session");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, latestSession) => {
      setStoredToken(latestSession);
      setSession(latestSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user || null;
  const displayName = useMemo(() => getDisplayName(user), [user]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  async function handleSignOut() {
    try {
      await signOut();
      setSession(null);
    } catch (signOutError) {
      setError(signOutError.message || "Failed to sign out");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          {APP_NAME}
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>
            Study
          </NavLink>
          <NavLink to="/quiz">Quiz</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <div className="auth-box">
          {user ? (
            <>
              <span className="avatar-chip" title={displayName}>
                {initials}
              </span>
              <span className="user-name">{displayName}</span>
              <button className="ghost-btn" type="button" onClick={handleSignOut}>
                Log out
              </button>
            </>
          ) : (
            <Link className="ghost-btn" to="/login">
              Log in
            </Link>
          )}
        </div>
      </header>

      {error ? <p className="global-error">{error}</p> : null}

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<StudyPage user={user} loading={loading} />} />
          <Route path="/quiz" element={<QuizPage user={user} loading={loading} />} />
          <Route path="/login" element={<LoginPage user={user} loading={loading} />} />
          <Route path="/profile" element={<ProfilePage user={user} loading={loading} />} />
          <Route path="*" element={<StudyPage user={user} loading={loading} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
