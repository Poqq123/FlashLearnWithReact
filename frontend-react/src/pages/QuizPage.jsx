import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCards, getCollections, resetProgress, reviewCard } from "../lib/api";
import { computeProgress, normalizeText } from "../lib/utils";

function QuizPage({ user, loading }) {
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);

  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [attempted, setAttempted] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentCard = cards[index] || null;
  const progress = useMemo(() => computeProgress(cards), [cards]);

  useEffect(() => {
    if (index > cards.length - 1) {
      setIndex(Math.max(0, cards.length - 1));
    }
  }, [cards.length, index]);

  async function loadData() {
    if (!user) {
      return;
    }

    setIsLoadingData(true);
    setError("");
    try {
      const [nextCollections, nextCards] = await Promise.all([
        getCollections(),
        getCards(selectedCollectionId),
      ]);
      setCollections(nextCollections);
      setCards(nextCards);
    } catch (loadError) {
      setError(loadError.message || "Failed to load quiz data");
    } finally {
      setIsLoadingData(false);
    }
  }

  useEffect(() => {
    if (!user || loading) {
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, selectedCollectionId]);

  function moveToNextCard() {
    setAnswerInput("");
    setFeedback("");
    setIsCorrect(null);
    if (!cards.length) {
      return;
    }
    setIndex((value) => (value + 1) % cards.length);
  }

  async function handleCheckAnswer(event) {
    event.preventDefault();
    if (!currentCard) {
      return;
    }

    const normalizedGuess = normalizeText(answerInput);
    const normalizedAnswer = normalizeText(currentCard.answer);

    if (!normalizedGuess) {
      setFeedback("Enter an answer first.");
      setIsCorrect(false);
      return;
    }

    const answerIsCorrect = normalizedGuess === normalizedAnswer;
    setAttempted((value) => value + 1);
    if (answerIsCorrect) {
      setCorrect((value) => value + 1);
    }

    setIsSubmitting(true);
    setError("");

    try {
      const reviewPayload = await reviewCard(currentCard.id, answerIsCorrect ? "good" : "again");
      setCards((previousCards) =>
        previousCards.map((card) => (card.id === currentCard.id ? reviewPayload.card : card))
      );
      setIsCorrect(answerIsCorrect);
      setFeedback(
        answerIsCorrect ? "Correct. Review logged as Good." : `Not quite. Correct answer: ${currentCard.answer}`
      );
    } catch (reviewError) {
      setError(reviewError.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetProgress() {
    setIsSubmitting(true);
    setError("");

    try {
      await resetProgress(selectedCollectionId);
      setAttempted(0);
      setCorrect(0);
      setFeedback("Progress reset completed.");
      setIsCorrect(null);
      await loadData();
    } catch (resetError) {
      setError(resetError.message || "Failed to reset progress");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading session...</p>;
  }

  if (!user) {
    return (
      <section className="panel narrow">
        <h1>Quiz</h1>
        <p>Please log in to use quiz mode.</p>
        <Link className="ghost-btn" to="/login?next=/quiz">
          Go to login
        </Link>
      </section>
    );
  }

  const localAccuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  return (
    <section className="panel">
      <div className="row spread">
        <h1>Quiz mode</h1>
        <Link className="ghost-btn" to="/">
          Back to study
        </Link>
      </div>

      <p className="muted">Select a collection and type your answer.</p>

      <div className="row wrap">
        <button
          type="button"
          className={selectedCollectionId === null ? "chip active" : "chip"}
          onClick={() => {
            setSelectedCollectionId(null);
            setIndex(0);
          }}
        >
          All collections
        </button>
        {collections.map((collection) => (
          <button
            key={collection.id}
            type="button"
            className={selectedCollectionId === collection.id ? "chip active" : "chip"}
            onClick={() => {
              setSelectedCollectionId(collection.id);
              setIndex(0);
            }}
          >
            <span
              className="color-dot"
              style={{ backgroundColor: collection.color || "#0F4C5C" }}
              aria-hidden="true"
            />
            {collection.name}
          </button>
        ))}
      </div>

      <div className="stats-grid compact">
        <article>
          <h3>Total</h3>
          <p>{progress.total}</p>
        </article>
        <article>
          <h3>Mastered</h3>
          <p>{progress.mastered}</p>
        </article>
        <article>
          <h3>Global accuracy</h3>
          <p>{progress.accuracy}%</p>
        </article>
        <article>
          <h3>Session accuracy</h3>
          <p>{localAccuracy}%</p>
        </article>
      </div>

      {currentCard ? (
        <>
          <div className="question-box">
            <h2>{currentCard.question}</h2>
            <p>
              Card {index + 1} of {cards.length}
            </p>
          </div>

          <form onSubmit={handleCheckAnswer} className="stack-form">
            <textarea
              placeholder="Type your answer"
              value={answerInput}
              onChange={(event) => setAnswerInput(event.target.value)}
              required
            />
            <div className="row">
              <button type="submit" disabled={isSubmitting}>
                Check answer
              </button>
              <button type="button" className="ghost-btn" onClick={moveToNextCard}>
                Next card
              </button>
              <button type="button" className="danger" onClick={handleResetProgress} disabled={isSubmitting}>
                Reset progress
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="question-box empty">
          <h2>No cards available for this scope</h2>
          <p>Create cards in Study mode first.</p>
        </div>
      )}

      {feedback ? (
        <p className={isCorrect ? "inline-info" : "inline-error"}>
          {feedback}
        </p>
      ) : null}
      {isLoadingData ? <p className="muted">Loading quiz data...</p> : null}
      {error ? <p className="inline-error">{error}</p> : null}
    </section>
  );
}

export default QuizPage;
