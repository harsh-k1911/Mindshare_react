// Tag selection controls used to filter idea feeds by category.
function TagFilter({ tags, selectedTag, onTagChange }) {
  return (
    <div className="tag-filter">
      {tags.map((tag) => (
        <button
          key={tag}
          className={`tag-filter__button ${
            selectedTag === tag ? "tag-filter__button--active" : ""
          }`}
          onClick={() => onTagChange(tag)}
          type="button"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

export default TagFilter;
