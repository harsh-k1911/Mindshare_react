import { useState } from "react";
import IdeaCard from "../components/IdeaCard";
import TagFilter from "../components/TagFilter";

const tagOptions = [
  "All",
  "AI",
  "Startup",
  "Tech",
  "Health",
  "Education",
  "Environment",
  "Design",
];

// Home feed page with tag filtering, sorting, and card grid.
function Home({
  ideas,
  searchTerm,
  savedIds,
  onSave,
  onUpvote,
  onDownvote,
  getVoteState,
  onReadMore,
}) {
  const [selectedTag, setSelectedTag] = useState("All");
  const [sortBy, setSortBy] = useState("Trending");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredIdeas = ideas
    .filter((idea) => {
      const matchesSearch =
        idea.title.toLowerCase().includes(normalizedSearch) ||
        idea.description.toLowerCase().includes(normalizedSearch);
      const matchesTag = selectedTag === "All" || idea.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((first, second) => {
      if (sortBy === "Newest") {
        return new Date(second.createdAt) - new Date(first.createdAt);
      }
      return second.upvotes - first.upvotes;
    });

  return (
    <section>
      <div className="feed-controls">
        <TagFilter
          tags={tagOptions}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
        />
        <div className="sort-controls">
          <label htmlFor="sortBy">Sort by:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="Trending">Trending</option>
            <option value="Newest">Newest</option>
          </select>
        </div>
      </div>

      {filteredIdeas.length === 0 ? (
        <p className="empty-state">No ideas match your current filters.</p>
      ) : (
        <div className="idea-grid">
          {filteredIdeas.map((idea) => (
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
        </div>
      )}
    </section>
  );
}

export default Home;
