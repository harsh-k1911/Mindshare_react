import IdeaCard from "../components/IdeaCard";

// Saved ideas page showing only bookmarked ideas.
function Saved({
  ideas,
  savedIds,
  searchTerm,
  onSave,
  onUpvote,
  onDownvote,
  getVoteState,
  onReadMore,
}) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const savedIdeas = ideas.filter((idea) => {
    const matchesSaved = savedIds.includes(idea.id);
    const matchesSearch =
      idea.title.toLowerCase().includes(normalizedSearch) ||
      idea.description.toLowerCase().includes(normalizedSearch);
    return matchesSaved && matchesSearch;
  });

  if (savedIdeas.length === 0) {
    return <p className="empty-state">No saved ideas yet. Start exploring!</p>;
  }

  return (
    <section className="idea-grid">
      {savedIdeas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          isSaved={savedIds.includes(idea.id)}
          onSave={onSave}
          onUpvote={onUpvote}
          onDownvote={onDownvote}
          voteState={getVoteState(idea.id)}
          onReadMore={onReadMore}
        />
      ))}
    </section>
  );
}

export default Saved;
