import { useState } from "react";

const availableTags = [
  "AI",
  "Startup",
  "Tech",
  "Health",
  "Education",
  "Environment",
  "Design",
];

// New idea submission page with validation and success feedback.
function SubmitIdea({ onSubmitIdea }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const toggleTag = (tag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  };

  const submitForm = (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    onSubmitIdea({
      title: title.trim(),
      description: description.trim(),
      tags: selectedTags.length > 0 ? selectedTags : ["Startup"],
      author: "You",
      avatar: "YU",
    });

    setTitle("");
    setDescription("");
    setSelectedTags([]);
    setSuccessMessage("Idea submitted successfully!");
  };

  return (
    <section className="submit-page">
      <h2>Submit New Idea</h2>
      <form className="submit-form" onSubmit={submitForm}>
        <label htmlFor="ideaTitle">Title</label>
        <input
          id="ideaTitle"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter your idea title"
        />

        <label htmlFor="ideaDescription">Description</label>
        <textarea
          id="ideaDescription"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe your idea"
          rows={6}
        />

        <div className="tag-select">
          <span>Tags</span>
          <div className="tag-checkbox-grid">
            {availableTags.map((tag) => (
              <label key={tag}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="form-message error">{error}</p>}
        {successMessage && <p className="form-message success">{successMessage}</p>}

        <button type="submit" className="primary-button">
          Submit Idea
        </button>
      </form>
    </section>
  );
}

export default SubmitIdea;
