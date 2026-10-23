/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const modCol = app.findCollectionByNameOrId('modelos_processos')

    // Atualizar modelo B (Nova Locação) para incorporar os 4 passos da Superlógica
    const modelosB = app.findRecordsByFilter(
      'modelos_processos',
      "codigo = 'MOD-LOC-10FASES'",
      '-created',
      1,
      0,
    )

    if (modelosB.length > 0) {
      const rec = modelosB[0]
      const fases = rec.get('fases') || []

      // Injetar modo_execucao ('automatica' / 'humana') e integracao_alvo em cada atividade
      const novasFases = fases.map((fase) => {
        const ativsAtualizadas = (fase.atividades || []).map((atv) => {
          const isAuto =
            atv.tipo === 'Automação por regra' ||
            atv.titulo?.toLowerCase().includes('enviar') ||
            atv.titulo?.toLowerCase().includes('disparo') ||
            atv.titulo?.toLowerCase().includes('cadastrar ou atualizar') ||
            atv.titulo?.toLowerCase().includes('abrir o card')

          return {
            ...atv,
            modo_execucao: atv.modo_execucao || (isAuto ? 'automatica' : 'humana'),
            integracao_alvo:
              atv.integracao_alvo ||
              (atv.titulo?.toLowerCase().includes('whatsapp')
                ? 'whatsapp'
                : atv.titulo?.toLowerCase().includes('erp')
                  ? 'erp_superlogica'
                  : atv.titulo?.toLowerCase().includes('assinatura')
                    ? 'assinatura_eletronica'
                    : atv.titulo?.toLowerCase().includes('score') ||
                        atv.titulo?.toLowerCase().includes('serasa')
                      ? 'score_cpf'
                      : 'nenhuma'),
          }
        })
        return { ...fase, atividades: ativsAtualizadas }
      })

      rec.set('fases', novasFases)
      app.save(rec)
    }

    // Atualizar modelo C (Manutenção Predial) com a legenda Superlógica
    const modelosC = app.findRecordsByFilter(
      'modelos_processos',
      "codigo = 'MOD-MANUT-COMPLETO'",
      '-created',
      1,
      0,
    )

    if (modelosC.length > 0) {
      const rec = modelosC[0]
      const fases = rec.get('fases') || []

      const novasFases = fases.map((fase) => {
        const ativsAtualizadas = (fase.atividades || []).map((atv) => {
          const isAuto =
            atv.tipo === 'Automação por regra' ||
            atv.titulo?.toLowerCase().includes('abrir a manutenção') ||
            atv.titulo?.toLowerCase().includes('anexar as fotos') ||
            atv.titulo?.toLowerCase().includes('consultar prestadores') ||
            atv.titulo?.toLowerCase().includes('enviar o orçamento')

          return {
            ...atv,
            modo_execucao: atv.modo_execucao || (isAuto ? 'automatica' : 'humana'),
            integracao_alvo:
              atv.integracao_alvo ||
              (atv.titulo?.toLowerCase().includes('whatsapp') ? 'whatsapp' : 'nenhuma'),
          }
        })
        return { ...fase, atividades: ativsAtualizadas }
      })

      rec.set('fases', novasFases)
      app.save(rec)
    }
  },
  () => {},
)
