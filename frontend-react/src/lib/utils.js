export function getDisplayName(user) {
  const metadata = user?.user_metadata || {};
  return metadata.full_name || metadata.name || user?.email || "Learner";
}

export function getInitials(displayName) {
  const parts = (displayName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "FL";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeProgress(cards) {
  const total = cards.length;
  const reviewedToday = cards.filter((card) => {
    if (!card.last_reviewed_at) {
      return false;
    }
    const reviewedDate = new Date(card.last_reviewed_at);
    const now = new Date();
    return (
      reviewedDate.getUTCFullYear() === now.getUTCFullYear() &&
      reviewedDate.getUTCMonth() === now.getUTCMonth() &&
      reviewedDate.getUTCDate() === now.getUTCDate()
    );
  }).length;

  const mastered = cards.filter((card) => {
    const correctCount = Number(card.correct_count || 0);
    const reviewCount = Number(card.review_count || 0);
    return correctCount >= 5 && reviewCount >= 5;
  }).length;

  const due = cards.filter((card) => {
    if (!card.due_at) {
      return false;
    }
    return new Date(card.due_at) <= new Date();
  }).length;

  const reviewTotal = cards.reduce((sum, card) => sum + Number(card.review_count || 0), 0);
  const correctTotal = cards.reduce((sum, card) => sum + Number(card.correct_count || 0), 0);
  const accuracy = reviewTotal > 0 ? Math.round((correctTotal / reviewTotal) * 100) : 0;

  return {
    total,
    due,
    mastered,
    accuracy,
    reviewedToday,
  };
}
