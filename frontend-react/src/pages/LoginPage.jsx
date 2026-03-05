import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../lib/auth";
import { getDisplayName } from "../lib/utils";

function LoginPage({ user, loading }) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const rawNext = params.get("next") || "/";
    if (!rawNext.startsWith("/")) {
      return "/";
    }
    return rawNext;
  }, [location.search]);

  async function handleGoogleLogin() {
    setError("");
    setIsSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/login?next=${encodeURIComponent(nextPath)}`;
      await signInWithGoogle(redirectUrl);
    } catch (loginError) {
      setError(loginError.message || "Failed to start Google login");
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading session...</p>;
  }

  if (user) {
    return (
      <section className="panel narrow">
        <h1>Logged in</h1>
        <p>You are signed in as {getDisplayName(user)}.</p>
        <div className="row">
          <button type="button" onClick={() => navigate(nextPath)}>
            Continue
          </button>
          <Link className="ghost-btn" to="/profile">
            Open profile
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel narrow">
      <h1>Log in to FlashLearn</h1>
      <p>Use Google sign-in to access your cards and collections.</p>
      <button type="button" onClick={handleGoogleLogin} disabled={isSubmitting}>
        {isSubmitting ? "Redirecting..." : "Continue with Google"}
      </button>
      {error ? <p className="inline-error">{error}</p> : null}
    </section>
  );
}

export default LoginPage;
