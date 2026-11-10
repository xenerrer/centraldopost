# Central do Post — landing page

Site estático (HTML, CSS e JS, sem build local). Publicado em https://centraldopost.lucasschoenherr.com.br pelo GitHub Pages.

- Cada push na `main` publica sozinho (`.github/workflows/deploy.yml`), com CSS e JS minificados no caminho.
- Ao mudar CSS ou JS, suba o número `?v=` dos links no `index.html` para furar o cache dos visitantes.
- Fonte Archivo, GSAP, ScrollTrigger e Lenis ficam no próprio repositório (`assets/fonts`, `assets/vendor`): nenhum pedido a domínios de terceiros.
- Para testar local: `python3 -m http.server 4173` nesta pasta.
