import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCards } from "../lib/api";
import { getDisplayName, getInitials } from "../lib/utils";

function ProfilePage({ user, loading }) {
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    async function loadCardCount() {
      setIsLoadingCount(true);
      setError("");
      try {
        const cards = await getCards(null);
        if (active) {
          setCount(cards.length);
        }
      } catch (countError) {
        if (active) {
          setError(countError.message || "Failed to load card count");
        }
      } finally {
        if (active) {
          setIsLoadingCount(false);
        }
      }
    }

    loadCardCount();

    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return <p>Loading session...</p>;
  }

  if (!user) {
    return (
      <section className="panel narrow">
        <h1>Profile</h1>
        <p>Please log in first.</p>
        <Link className="ghost-btn" to="/login?next=/profile">
          Go to login
        </Link>
      </section>
    );
  }

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown";

  return (
    <section className="panel narrow">
      <h1>Profile</h1>
      <div className="profile-head">
        <span className="avatar-large">{initials}</span>
        <div>
          <h2>{displayName}</h2>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="stats-grid">
        <article>
          <h3>Member since</h3>
          <p>{createdAt}</p>
        </article>
        <article>
          <h3>Total cards</h3>
          <p>{isLoadingCount ? "Loading..." : count}</p>
        </article>
      </div>

      {error ? <p className="inline-error">{error}</p> : null}
    </section>
  );
}

export default ProfilePage;
