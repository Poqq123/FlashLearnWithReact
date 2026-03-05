import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createCard,
  createCollection,
  deleteCard,
  deleteCollection,
  getCards,
  getCollections,
  reviewCard,
  updateCard,
  updateCollection,
} from "../lib/api";
import { computeProgress } from "../lib/utils";

const INITIAL_COLLECTION_FORM = {
  name: "",
  class_name: "",
  color: "#0F4C5C",
};

const INITIAL_CARD_FORM = {
  question: "",
  answer: "",
};

function StudyPage({ user, loading }) {
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [collectionForm, setCollectionForm] = useState(INITIAL_COLLECTION_FORM);
  const [collectionEditForm, setCollectionEditForm] = useState(INITIAL_COLLECTION_FORM);
  const [cardForm, setCardForm] = useState(INITIAL_CARD_FORM);
  const [cardEditForm, setCardEditForm] = useState(INITIAL_CARD_FORM);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const selectedCollection = useMemo(
    () => collections.find((item) => item.id === selectedCollectionId) || null,
    [collections, selectedCollectionId]
  );

  const currentCard = cards[currentIndex] || null;
  const progress = useMemo(() => computeProgress(cards), [cards]);

  useEffect(() => {
    if (!selectedCollection) {
      setCollectionEditForm(INITIAL_COLLECTION_FORM);
      return;
    }

    setCollectionEditForm({
      name: selectedCollection.name || "",
      class_name: selectedCollection.class_name || "",
      color: selectedCollection.color || "#0F4C5C",
    });
  }, [selectedCollection]);

  useEffect(() => {
    if (!currentCard) {
      setCardEditForm(INITIAL_CARD_FORM);
      return;
    }

    setCardEditForm({
      question: currentCard.question || "",
      answer: currentCard.answer || "",
    });
  }, [currentCard]);

  useEffect(() => {
    if (currentIndex > cards.length - 1) {
      setCurrentIndex(Math.max(0, cards.length - 1));
    }
  }, [cards.length, currentIndex]);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex, selectedCollectionId]);

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
      setError(loadError.message || "Failed to load data");
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

  async function handleCreateCollection(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setInfo("");

    try {
      await createCollection({
        name: collectionForm.name,
        class_name: collectionForm.class_name || null,
        color: collectionForm.color,
      });
      setCollectionForm(INITIAL_COLLECTION_FORM);
      setInfo("Collection created.");
      await loadData();
    } catch (submitError) {
      setError(submitError.message || "Failed to create collection");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateSelectedCollection(event) {
    event.preventDefault();
    if (!selectedCollection) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setInfo("");

    try {
      await updateCollection(selectedCollection.id, {
        name: collectionEditForm.name,
        class_name: collectionEditForm.class_name || null,
        color: collectionEditForm.color,
      });
      setInfo("Collection updated.");
      await loadData();
    } catch (submitError) {
      setError(submitError.message || "Failed to update collection");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSelectedCollection() {
    if (!selectedCollection) {
      return;
    }

    const confirmed = window.confirm(
      `Delete collection "${selectedCollection.name}"? Cards will be unassigned.`
    );
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setInfo("");

    try {
      await deleteCollection(selectedCollection.id);
      setSelectedCollectionId(null);
      setCurrentIndex(0);
      setInfo("Collection deleted.");
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete collection");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateCard(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setInfo("");

    try {
      await createCard({
        question: cardForm.question,
        answer: cardForm.answer,
        collection_id: selectedCollectionId,
      });
      setCardForm(INITIAL_CARD_FORM);
      setInfo("Card added.");
      await loadData();
      setCurrentIndex(Math.max(0, cards.length));
    } catch (submitError) {
      setError(submitError.message || "Failed to add card");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateCurrentCard(event) {
    event.preventDefault();
    if (!currentCard) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setInfo("");

    try {
      await updateCard(currentCard.id, {
        question: cardEditForm.question,
        answer: cardEditForm.answer,
        collection_id: currentCard.collection_id,
      });
      setInfo("Card updated.");
      await loadData();
    } catch (submitError) {
      setError(submitError.message || "Failed to update card");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteCurrentCard() {
    if (!currentCard) {
      return;
    }

    const confirmed = window.confirm("Delete this card?");
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setInfo("");

    try {
      await deleteCard(currentCard.id);
      setInfo("Card deleted.");
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete card");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReview(rating) {
    if (!currentCard) {
      return;
    }

    setError("");
    setInfo("");
    try {
      const payload = await reviewCard(currentCard.id, rating);
      setCards((previousCards) =>
        previousCards.map((card) => (card.id === currentCard.id ? payload.card : card))
      );
      setInfo(`Review recorded: ${rating}`);
    } catch (reviewError) {
      setError(reviewError.message || "Failed to record review");
    }
  }

  if (loading) {
    return <p>Loading session...</p>;
  }

  if (!user) {
    return (
      <section className="panel narrow">
        <h1>Study</h1>
        <p>Please log in to manage flashcards.</p>
        <Link className="ghost-btn" to="/login?next=/">
          Go to login
        </Link>
      </section>
    );
  }

  return (
    <section className="study-page">
      <article className="panel">
        <h1>Collections</h1>
        <p className="muted">Choose a collection scope for cards and quiz.</p>

        <div className="collection-list">
          <button
            type="button"
            className={selectedCollectionId === null ? "chip active" : "chip"}
            onClick={() => {
              setSelectedCollectionId(null);
              setCurrentIndex(0);
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
                setCurrentIndex(0);
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

        <form onSubmit={handleCreateCollection} className="stack-form">
          <h2>New collection</h2>
          <input
            type="text"
            placeholder="Collection name"
            value={collectionForm.name}
            onChange={(event) => setCollectionForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Class name (optional)"
            value={collectionForm.class_name}
            onChange={(event) =>
              setCollectionForm((prev) => ({ ...prev, class_name: event.target.value }))
            }
          />
          <input
            type="color"
            value={collectionForm.color}
            onChange={(event) => setCollectionForm((prev) => ({ ...prev, color: event.target.value }))}
          />
          <button type="submit" disabled={isSubmitting}>
            Create collection
          </button>
        </form>

        {selectedCollection ? (
          <form onSubmit={handleUpdateSelectedCollection} className="stack-form">
            <h2>Edit selected collection</h2>
            <input
              type="text"
              value={collectionEditForm.name}
              onChange={(event) =>
                setCollectionEditForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
            <input
              type="text"
              value={collectionEditForm.class_name}
              onChange={(event) =>
                setCollectionEditForm((prev) => ({ ...prev, class_name: event.target.value }))
              }
            />
            <input
              type="color"
              value={collectionEditForm.color}
              onChange={(event) =>
                setCollectionEditForm((prev) => ({ ...prev, color: event.target.value }))
              }
            />
            <div className="row">
              <button type="submit" disabled={isSubmitting}>
                Save collection
              </button>
              <button type="button" className="danger" onClick={handleDeleteSelectedCollection}>
                Delete collection
              </button>
            </div>
          </form>
        ) : null}
      </article>

      <article className="panel">
        <div className="row spread">
          <h1>Flashcards</h1>
          <Link className="ghost-btn" to="/quiz">
            Open quiz mode
          </Link>
        </div>

        <div className="stats-grid compact">
          <article>
            <h3>Total</h3>
            <p>{progress.total}</p>
          </article>
          <article>
            <h3>Due</h3>
            <p>{progress.due}</p>
          </article>
          <article>
            <h3>Mastered</h3>
            <p>{progress.mastered}</p>
          </article>
          <article>
            <h3>Accuracy</h3>
            <p>{progress.accuracy}%</p>
          </article>
        </div>

        {currentCard ? (
          <div className="card-box" onClick={() => setIsFlipped((value) => !value)} role="button" tabIndex={0}>
            <h2>{isFlipped ? currentCard.answer : currentCard.question}</h2>
            <p className="muted">Click card to flip</p>
          </div>
        ) : (
          <div className="card-box empty">
            <h2>No cards in this scope</h2>
            <p className="muted">Add your first card below.</p>
          </div>
        )}

        <div className="row spread">
          <button
            type="button"
            onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
            disabled={!currentCard || currentIndex === 0}
          >
            Previous
          </button>
          <span>
            {cards.length ? currentIndex + 1 : 0} / {cards.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentIndex((value) => Math.min(cards.length - 1, value + 1))}
            disabled={!currentCard || currentIndex >= cards.length - 1}
          >
            Next
          </button>
        </div>

        <div className="row review-row">
          <button type="button" onClick={() => handleReview("again")} disabled={!currentCard}>
            Again
          </button>
          <button type="button" onClick={() => handleReview("hard")} disabled={!currentCard}>
            Hard
          </button>
          <button type="button" onClick={() => handleReview("good")} disabled={!currentCard}>
            Good
          </button>
          <button type="button" onClick={() => handleReview("easy")} disabled={!currentCard}>
            Easy
          </button>
        </div>

        <form onSubmit={handleCreateCard} className="stack-form">
          <h2>Add card</h2>
          <textarea
            placeholder="Question"
            value={cardForm.question}
            onChange={(event) => setCardForm((prev) => ({ ...prev, question: event.target.value }))}
            required
          />
          <textarea
            placeholder="Answer"
            value={cardForm.answer}
            onChange={(event) => setCardForm((prev) => ({ ...prev, answer: event.target.value }))}
            required
          />
          <button type="submit" disabled={isSubmitting}>
            Save card
          </button>
        </form>

        {currentCard ? (
          <form onSubmit={handleUpdateCurrentCard} className="stack-form">
            <h2>Edit current card</h2>
            <textarea
              value={cardEditForm.question}
              onChange={(event) =>
                setCardEditForm((prev) => ({ ...prev, question: event.target.value }))
              }
              required
            />
            <textarea
              value={cardEditForm.answer}
              onChange={(event) =>
                setCardEditForm((prev) => ({ ...prev, answer: event.target.value }))
              }
              required
            />
            <div className="row">
              <button type="submit" disabled={isSubmitting}>
                Update card
              </button>
              <button type="button" className="danger" onClick={handleDeleteCurrentCard}>
                Delete card
              </button>
            </div>
          </form>
        ) : null}

        {isLoadingData ? <p className="muted">Loading data...</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}
        {info ? <p className="inline-info">{info}</p> : null}
      </article>
    </section>
  );
}

export default StudyPage;
