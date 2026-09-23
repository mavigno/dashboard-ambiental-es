# Plataforma Integrada de Inteligência Ambiental do Espírito Santo

Este repositório contém a auditoria técnica da primeira fase do projeto. O objetivo é verificar quais fontes ambientais podem sustentar um serviço público, vivo, rastreável e expansível. Não contém o produto final.

## Estado da auditoria

- Início: 2026-09-22
- Monitoramento recorrente encerrado antecipadamente em 2026-09-22 por decisão do usuário; automação pausada. A janela de 14 dias não foi completada.
- Ambiente de observação: Mac local
- Território inicial: Espírito Santo e área oceânica adjacente
- Uso-alvo definido: serviço público não comercial; permissões de cópia, armazenamento, transformação e redistribuição continuam sendo avaliadas por dataset

## Estrutura

- `docs/`: método, decisões, resultados e entregas narrativas
- `data/inventory/`: inventário e matriz técnica em formatos abertos
- `evidence/`: manifestos e registros produzidos pelos testes; corpos baixados não entram por padrão
- `scripts/`: testes reproduzíveis e coleta longitudinal
- `site/`: prévia local do Dashboard, com Visão geral e Fogo em visual LCARS

As conclusões devem apontar para uma linha do inventário e para evidências de teste. Documentação declaratória não será tratada como prova de funcionamento.

O acompanhamento da janela de 14 dias é resumido em `docs/MONITORAMENTO.md`.

## Prévia local do Dashboard

O site está em `site/`. Para executar: `cd site && npm install && npm run dev`. Para validar a compilação: `npm run build`.

A camada de fogo usa somente o arquivo anual do INPE para o ES em 2024, preservado na auditoria. O conjunto local exibido pode ser reproduzido com `python3 scripts/build_fire_snapshot.py`. A prévia não tem integração atual nem previsão operacional. As permissões de cópia, exibição pública e redistribuição do conjunto ainda devem ser verificadas antes de publicar ou oferecer download dos dados.
