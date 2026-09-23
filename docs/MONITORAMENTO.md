# Monitoramento longitudinal

Janela planejada: 2026-09-22 a 2026-10-06. Os horários abaixo estão em UTC. Mudança de hash de uma página comprova mudança do conteúdo entregue, não atualização das observações ambientais.

## Encerramento antecipado

Em 2026-09-22, a pedido do usuário, a automação foi pausada para reduzir consumo de recursos e permitir avançar à construção do Dashboard. A redução intermediária de 15 minutos para 6 horas foi substituída pela pausa. Não haverá novas consultas recorrentes nem compensação de rodadas. A janela planejada de 14 dias não foi concluída; as evidências existentes permanecem preservadas.

A investigação já orienta o desenho da interface, a proveniência e a separação entre observações e previsões. O INPE forneceu arquivos reais e avanço do catálogo atual; o inventário ANA forneceu estações. Isso não demonstra ingestão atual de rios, ar, meteorologia ou oceano, nem permissões de redistribuição de todas as fontes. A construção deve habilitar cada integração após validação pontual e mostrar explicitamente dados indisponíveis, históricos e pendências, sem apresentar amostras como situação atual. A auditoria ampla e suas 13 entregas não são declaradas concluídas.

## 2026-09-22

| Fonte | Consultas | Resultado inicial |
|---|---:|---|
| AGERH SARI | 2 | HTTP 200 nas duas consultas. Mesmo tamanho (38.469 bytes) e mesmo SHA-256 entre 16:09 e 18:57. Nenhuma mudança detectada na página. |
| IEMA Qualidade do Ar | 2 | HTTP 200. O tamanho passou de 218.064 para 218.434 bytes e o hash mudou entre 16:10 e 18:12. É necessário identificar se a diferença corresponde a observações, conteúdo editorial ou elementos dinâmicos. |
| Incaper Meteorologia | 2 | HTTP 200. O tamanho passou de 223.486 para 120.072 bytes; o ETag presente na primeira resposta não apareceu na segunda. A variação é grande demais para ser interpretada como atualização meteorológica sem inspeção estrutural. |
| INPE Queimadas, página de dados abertos | 2 | HTTP 200. O corpo permaneceu idêntico, mas ETag e Last-Modified mudaram; o servidor marcou atualização sem mudança no conteúdo recuperado. Metadados HTTP isolados não devem medir atualização do dataset. |

Um arquivo real de focos de 10 minutos do INPE foi obtido em 19:35 UTC. Seus campos são `lat`, `lon`, `satelite` e `data`. O arquivo nominal de 19/09/2026 00:00 tem Last-Modified de 00:00:02 UTC e uma primeira observação de 18/09/2026 23:40:00. Isso mostra que o horário no nome do arquivo e o horário da detecção não são a mesma entidade temporal. A amostra não contém pontos do ES.

Um ZIP anual de 2024 específico do ES foi obtido e aberto. Seu CSV tem nove campos, incluindo identificadores, município e bioma. Esse esquema difere do arquivo de 10 minutos; um conector deverá mapear os dois produtos separadamente. O diretório anual estadual consultado termina em 2024, portanto não serve sozinho para o feed atual.

Às 22:01:41 UTC, uma consulta HTTP direta ao índice de arquivos de 10 minutos encontrou `focos_10min_20260922_2200.csv` como último nome listado. A indexação de busca disponível no mesmo momento terminava em 13:40; portanto, páginas de busca não podem substituir a consulta direta na medição de atualidade. O nome do arquivo indica publicação próxima ao instante da consulta, mas ainda não comprova latência entre cada detecção e sua publicação.

Às 22:16:32 UTC, o último nome listado já era `focos_10min_20260922_2210.csv`. As duas consultas demonstram avanço do catálogo no intervalo de 15 minutos. A distância entre horário nominal do último arquivo e consulta foi de aproximadamente 1 minuto e 42 segundos na primeira observação e 6 minutos e 32 segundos na segunda; isso mede idade do arquivo mais recente no catálogo, não latência da detecção.

## Regras derivadas

- Frequência do produto deve ser medida no arquivo ou observação, não no HTML do portal.
- Mudanças de hash acionam inspeção dos campos relevantes antes de serem registradas como atualização ambiental.
- ETag e Last-Modified inconsistentes com o corpo serão preservados como comportamento do serviço, sem inferência sobre os dados.
