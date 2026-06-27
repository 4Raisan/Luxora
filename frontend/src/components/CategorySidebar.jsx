function CategorySidebar({ categories, onAddCategory, onDropGame }) {
  return (
    <aside className="glass-panel category-sidebar">
      <div className="category-header">
        <h3>Categories</h3>
        <button className="ghost-button" type="button" onClick={onAddCategory}>
          +
        </button>
      </div>

      <div className="category-list">
        {categories.map((category) => (
          <div
            key={category.id}
            className="category-item"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const steamAppId = Number(event.dataTransfer.getData('steamAppId'));
              onDropGame(category.id, steamAppId);
            }}
          >
            <span>{category.name}</span>
            <small>{category.items.length} games</small>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default CategorySidebar;
