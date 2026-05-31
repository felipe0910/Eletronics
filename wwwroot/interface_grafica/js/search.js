document.addEventListener('DOMContentLoaded', () => {
  const categoryAliases = {
    notebook: 'notebooks',
    notebooks: 'notebooks',
    computador: 'computadores',
    computadores: 'computadores',
    smartphone: 'smartphones',
    smartphones: 'smartphones',
    fone: 'fones',
    fones: 'fones',
    celular: 'smartphones',
    "fone de ouvido": 'fones',
    audio: 'fones',
    headphone: 'fones',
    headphone: 'fones'
  };

  document.querySelectorAll('.search-form').forEach((form) => {
    const input = form.querySelector('input[name="q"]');
    if (!input) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const rawQuery = input.value.trim();
      const normalized = rawQuery.toLowerCase();
      const alias = categoryAliases[normalized] || categoryAliases[normalized.replace(/\s+/g, '')];

      if (!rawQuery) {
        window.location.href = 'produtos.html';
        return;
      }

      const target = alias
        ? `produtos.html?categoria=${encodeURIComponent(alias)}`
        : `produtos.html?q=${encodeURIComponent(rawQuery)}`;

      window.location.href = target;
    });
  });
});
