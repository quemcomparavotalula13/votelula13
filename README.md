# Quem compara vota Lula

Site estático, não oficial, criado por iniciativa voluntária a partir de três guias em PDF.

## Publicar pelo GitHub e Netlify

1. Crie um repositório no GitHub com o nome `quem-compara-vota-lula`.
2. Envie a pasta `dist`, o arquivo `netlify.toml` e este `README.md` para a raiz do repositório. Envie os arquivos extraídos, não o ZIP.
3. No Netlify, escolha **Add new project → Import an existing project → GitHub** e selecione o repositório.
4. Use a branch `main`. Deixe **Base directory** e **Build command** vazios. Em **Publish directory**, use `dist`.
5. Publique. O Netlify disponibilizará o endereço do site e atualizará a publicação a cada alteração enviada ao GitHub.

O arquivo `netlify.toml` já define a pasta de publicação. Não é necessário instalar pacotes, configurar servidor ou executar npm.

## Conteúdo

- `dist/index.html`: página e textos principais.
- `dist/style.css`: aparência e adaptação para celular.
- `dist/app.js`: busca, filtros, compartilhamento e criação de cards do guia de bolso.
- `dist/cards.json`: cards do guia comparativo.
- `dist/pocket.json`: indicadores do guia de bolso.
- `dist/references.json`: conteúdos e referências do guia detalhado.
- `dist/assets/`: imagens e PDFs originais.

Preserve as pastas e os nomes dos arquivos. Os links de conteúdo usam o endereço onde o site está aberto, por isso também funcionam no Netlify.

## Ver no computador

Execute `python3 -m http.server 8000 --directory dist` e abra `http://localhost:8000`.

## Atualizar

Edite os arquivos no GitHub e confirme as alterações com **Commit changes**. O Netlify publicará a nova versão automaticamente.
