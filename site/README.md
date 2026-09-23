# Prévia local · Ambiente ES

Dashboard React + TypeScript + Vite, com visual LCARS. A navegação contém Visão geral e Fogo. Esta versão é somente local e não acessa dados ambientais atuais.

```sh
python3 scripts/build_fire_snapshot.py
cd site
npm install
npm run dev
```

O servidor local informa o endereço da prévia. `npm run build` valida TypeScript e gera `site/dist/`.

## Dados e método

`src/data/fire-2024.json` é gerado do ZIP em `evidence/samples/inpe_focos_es_2024.zip`. O script exige o esquema examinado na auditoria e confere 662 linhas, primeiro registro em 04/01/2024 e último em 20/12/2024. Ele preserva identificadores, datas, coordenadas, município e bioma. O CSV não inclui satélite nem fuso horário, então a interface não os inventa. O JSON inclui URL, caminho e SHA-256 do arquivo de origem.

O mapa usa pontos do conjunto local e um mapa-base do OpenStreetMap. Se as imagens do mapa-base falharem, os pontos, filtros e a lista continuam disponíveis. Um foco de calor é uma detecção remota; não é confirmação de incêndio. Os demais módulos da visão geral registram o estado da investigação sem valores fictícios.

Há duas escalas de exploração: estado completo e município. A visão estadual mostra apenas os pontos dos focos, sem marcadores municipais. Selecionar uma cidade na lista ou no filtro mostra todos os focos dela de uma vez. Na visão municipal, um contorno vetorial discreto acompanha a extensão dos focos filtrados; ele não representa o limite oficial do município. Quando há menos de três posições distintas, o contorno é um círculo geográfico pequeno ao redor dos registros. Os pontos rosados são os focos. A reprodução cronológica, acionada pelo usuário, revela esses pontos na ordem das datas do CSV; é possível pausar, percorrer a sequência e mostrar todos novamente.
Na visão municipal, a lista de focos permite consultar cada observação e seu ID sem ocultar os outros pontos.

## Publicação

Não publicar esta prévia nem oferecer download do conjunto transformado antes da verificação das permissões específicas de cópia, armazenamento, transformação, exibição e redistribuição do produto do INPE. Termos de outros provedores são avaliados separadamente.
