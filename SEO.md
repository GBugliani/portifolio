# Publicação e indexação

O layout e o conteúdo compartilhados ficam em `index.html`. Os títulos, descrições e endereços de cada tela ficam no bloco JSON `site-pages` desse arquivo.

Execute `node build.mjs` para gerar o site em `dist/`. A Vercel usa esse comando e essa pasta automaticamente pela configuração em `vercel.json`. Não publique apenas o HTML de origem: os endereços `/projetos`, `/sobre` e `/contato` precisam dos arquivos gerados. Cada endereço contém sua tela visível no HTML, mesmo sem JavaScript. O JavaScript mantém as transições entre as telas e atualiza o histórico e os metadados.

Ao abrir `index.html` diretamente como arquivo, o menu usa fragmentos (`#projects`, por exemplo) para respeitar as restrições de endereços locais do navegador. Na versão HTTP/HTTPS, usa os endereços próprios das páginas.

Depois da publicação:

1. Confirme que a página inicial, `/projetos`, `/sobre`, `/contato`, `/robots.txt` e `/sitemap.xml` abrem sem autenticação e sem erro.
2. No Google Search Console, adicione a propriedade de prefixo de URL `https://guilhermebugliani-dev.vercel.app/` e conclua a verificação de propriedade. Caso use uma meta tag de verificação, inclua o token fornecido pelo Google no `<head>` de `index.html` e publique novamente. O build preserva essa tag.
3. Envie `sitemap.xml` na seção Sitemaps do Search Console.
4. Inspecione o endereço da página inicial, teste a URL publicada e solicite indexação. Repita para as páginas internas se necessário.
5. Acompanhe os relatórios de indexação e desempenho para as buscas por seu nome. Uma ausência nas buscas, por si só, não confirma o motivo; o Search Console mostra se o Google conhece a URL e eventuais obstáculos.
6. Mantenha o endereço do portfólio nos seus perfis do LinkedIn e GitHub. Se mudar de domínio, atualize o endereço em `index.html`, `script.js`, `build.mjs`, `robots.txt` e `sitemap.xml`.

O sitemap e os dados estruturados ajudam a descoberta e a identificação do site; não garantem indexação, posição ou prazo nos resultados.

Referências oficiais:

- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
