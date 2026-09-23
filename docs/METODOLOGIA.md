# Metodologia da auditoria

## Unidade de análise

A unidade é uma combinação de dataset, produto e interface. Portais que republicam a mesma observação são registrados como distribuição ou derivação da fonte original, evitando dupla contagem de cobertura.

## Estados de validação

- `localizado`: acesso ou documentação encontrados.
- `documentado`: metadados oficiais examinados.
- `testado_com_dados`: consulta real retornou dados pertinentes.
- `testado_sem_dados_es`: serviço respondeu, mas a amostra não trouxe dados pertinentes ao Espírito Santo.
- `bloqueado`: exige credencial, autorização ou condição ainda indisponível.
- `falhou`: a tentativa reproduzível falhou.
- `monitorado`: passou por consultas repetidas na janela longitudinal.

`Não encontrado` significa apenas que a investigação não localizou o item até a data registrada.

## Protocolo de teste

Cada teste registra, no mínimo: identificador, fonte, URL e método, início e fim em UTC, status HTTP, duração, tipo e tamanho do conteúdo, ETag, Last-Modified, hash SHA-256, erro e caminho do corpo quando sua retenção for permitida.

APIs são examinadas quanto a parâmetros, paginação, filtros, campos, timestamps, respostas vazias e erros controlados. WMS/WFS/OGC recebem GetCapabilities e uma amostra pequena. Arquivos tabulares são inspecionados quanto a codificação, tipos, unidades, ausências, datas e coordenadas. NetCDF, GRIB, OPeNDAP e THREDDS são examinados quanto a dimensões, variáveis, unidades, calendário e resolução.

Não serão realizados testes de carga nem tentativas de contornar autenticação ou bloqueios.

## Tempo e latência

São separados:

1. instante da observação ou período de acumulação;
2. rodada e geração da previsão;
3. instante de validade da previsão;
4. publicação, quando fornecida;
5. primeira detecção pelo coletor;
6. instante da consulta.

Sem timestamp de publicação, a primeira detecção é apenas um limite dependente da frequência das consultas. Suspensão do Mac, ausência de rede e interrupção do coletor são marcadas como falhas locais.

## Licença

O uso-alvo do produto é público e não comercial. Para cada dataset são avaliados separadamente acesso, armazenamento, transformação, exibição, download e redistribuição. A vedação de uso comercial não desqualifica uma fonte, mas a disponibilidade pública de uma página ou arquivo não será interpretada automaticamente como autorização de copiar ou redistribuir seus dados.

## Qualidade e interpretação

Observações, estimativas, análises, reanálises, previsões, anomalias calculadas e alertas oficiais permanecem categorias distintas. Transformações preservam o valor e o identificador nativos. Relações entre fenômenos recebem uma classificação explícita: coincidência, associação exploratória, hipótese, relação conhecida ou causalidade demonstrada.
