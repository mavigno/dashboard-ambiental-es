# Resultados iniciais da auditoria

Data de corte: 2026-09-22. O usuário dispensou a continuidade da janela longitudinal e as consultas recorrentes foram pausadas. Estes resultados orientam a construção incremental do Dashboard; não comprovam estabilidade operacional dos cinco domínios. Os testes prioritários abaixo ficam como pendências pontuais de integração, sem execução recorrente.

## Síntese

A investigação confirmou que há fontes suficientes para continuar a auditoria, mas ainda não para afirmar que os cinco domínios da hipótese de MVP sustentam ingestão operacional. O principal padrão encontrado é a distância entre uma página pública, um endpoint que responde e um dataset atual utilizável.

## Testes executados

| Fonte ou interface | Resultado técnico | Interpretação atual |
|---|---|---|
| ANA `ServiceANA.asmx?WSDL` | HTTP 200; XML; 65.116 bytes; 431,5 ms | Serviço e contrato SOAP acessíveis no teste. |
| ANA `HidroInventario`, filtro fluviométrico para Espírito Santo | HTTP 200; XML; 1.286.149 bytes; 1.056,4 ms; 379 elementos `Table`; 100 com `TipoEstacaoTelemetrica=1` | Há inventário amplo, com campos de localização, responsabilidade, operação, períodos e atualização. A marcação telemétrica não comprova operação atual nem dados recentes. |
| ANA `HidroSerieHistorica`, estação 57562000, vazão em setembro de 2026 | HTTP 200; XML; 1.193 bytes | Falha semântica: o corpo informa ausência de dados no período. HTTP 200 isolado produziria falso positivo. |
| ANA `DadosHidrometeorologicos`, mesma estação e período | timeout de leitura após 30,2 s | Operação de telemetria atual ainda não demonstrada; requer janela menor, revisão do formato das datas e repetição controlada. |
| AGERH SARI | HTTP 200; HTML; 38.469 bytes; 237,4 ms | Página acessível, mas ainda falta separar telemetria de valores derivados e medir atualidade real. |
| AGERH IQA, bacia do Itapemirim | HTTP 200; HTML; 9.920 bytes; 209,2 ms | Consulta retorna pontos georreferenciados; parâmetros brutos, datas e downloads ainda precisam ser verificados. |
| IEMA Qualidade do Ar | HTTP 200; HTML; 218.064 bytes; 342,4 ms | Página acessível; endpoint estruturado de observações ainda não localizado. |
| GeoIEMA WMS presumido | falha TLS: certificado autoassinado | Automação com verificação TLS padrão não funciona nesse endereço. O endpoint e a cadeia do certificado precisam ser confirmados antes de qualquer alternativa. |
| Incaper Meteorologia | HTTP 200; HTML; 223.486 bytes; 640,4 ms | Portal acessível. A vedação de uso comercial é compatível com o projeto, mas a exigência de autorização para cópia ainda precisa ser resolvida por produto. |
| PNBOIA | HTTP 403 para o coletor | A página aparece em navegação indexada, mas acesso automatizado não foi demonstrado. Não será contornado sem interface ou permissão apropriada. |
| INMET endpoint presumido por UF | HTTP 404 | O endereço não é válido. Fontes oficiais indicam observações horárias e API mediante chave solicitada ao INMET; catálogo CSV e portal serão testados separadamente. |
| INPE Queimadas, dados abertos | HTTP 200 após redirecionamento; HTML; 17.422 bytes; 420,6 ms | Página atual localizada; próximo passo é testar arquivos e metadados oferecidos nela. |
| INPE Queimadas, CSV de 10 minutos de 19/09/2026 00:00 | HTTP 200; `text/csv`; 3.090 bytes; quatro campos: `lat`, `lon`, `satelite`, `data` | Arquivo estruturado real confirmado. A amostra examinada contém focos fora do ES; ainda não comprova cobertura capixaba. O horário de observação pode anteceder o horário nominal do arquivo. |
| INPE Queimadas, arquivo anual ES de 2024 | HTTP 200; ZIP de 28.126 bytes; CSV interno de 99.283 bytes | Amostra real com 662 registros entre 04/01 e 20/12/2024, distribuídos por 71 nomes de município. Campos: `id_bdq`, `foco_id`, `lat`, `lon`, `data_pas`, `pais`, `estado`, `municipio`, `bioma`. A pasta anual estadual encontrada vai até 2024; o fluxo atual precisa ser obtido dos arquivos nacionais ou de outra interface oficial. |

## Evidências sobre as fontes estaduais

O monitor de vazões da AGERH declara usar o webservice da ANA. Portanto, a AGERH deve ser registrada como organizadora ou produtora de derivados quando aplicável, preservando ANA, operador da estação e responsável como partes distintas da proveniência.

O SARI é um produto de previsão derivada, não uma observação. A nota técnica descreve regressões baseadas em vazões telemétricas e tempos de deslocamento, com calibração apoiada em poucos eventos de cheia. O produto precisa registrar rodada, validade, entradas e versão da regra antes de ser recomendado.

O QualiRios/IQA já demonstra cobertura espacial útil, mas a interface HTML e os boletins não comprovam uma série paramétrica pronta para ingestão. O índice não deve substituir medições constituintes.

## Riscos confirmados

- Resposta HTTP bem-sucedida pode conter erro de negócio ou série vazia.
- Portais estaduais podem não oferecer a mesma interface estruturada usada internamente.
- Certificados e bloqueios de cliente podem impedir automação mesmo quando a página funciona no navegador.
- Os termos do Incaper condicionam a cópia à autorização expressa; o caráter não comercial do projeto não resolve sozinho armazenamento e redistribuição.
- Inventários misturam estações antigas, inativas, não telemétricas e diferentes operadores; a contagem bruta superestima cobertura viva.

## Próximos testes prioritários

1. Identificar no inventário ANA quais estações do ES são telemétricas, operantes e atualizadas; testar janelas curtas nas operações atuais.
2. Localizar chamadas estruturadas usadas pelas interfaces do IEMA, AGERH, Satdes e INPE, sem presumir permissão de reutilização.
3. Testar catálogo CSV e caminho formal de chave da API do INMET.
4. Identificar acesso de dados PNBOIA e boias realmente operacionais no recorte oceânico do ES.
5. Testar arquivos de focos do INPE filtrados para ES, preservando satélite, data/hora e confiança/qualidade disponíveis.
6. Iniciar avaliação de previsões meteorológicas e oceânicas com rodada e tempo de validade preservados.
