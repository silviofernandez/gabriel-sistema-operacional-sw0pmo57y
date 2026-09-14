// Cron diário para verificar expiração de coberturas temporárias e registrar alertas
// Executa todo dia à meia-noite (00:05 UTC)
cronAdd('daily_metrics_and_coverage_check', '5 0 * * *', () => {
  const todayIso = new Date().toISOString().slice(0, 10)

  // 1. Verificar coberturas ativas vencidas
  try {
    const expiredCoverages = $app.findRecordsByFilter(
      'coberturas',
      "status = 'ativa' && data_fim_prevista < '" + todayIso + "'",
      '-created',
      100,
      0,
    )

    for (const cob of expiredCoverages) {
      cob.set('status', 'concluida')
      cob.set('data_fim_real', todayIso)
      $app.save(cob)

      // Desativar permissões temporárias associadas
      const subId = cob.getString('colaborador_substituto_id')
      try {
        const perms = $app.findRecordsByFilter(
          'etapas_permissoes',
          "colaborador_id = '" + subId + "' && tipo = 'temporaria' && is_active = true",
          '-created',
          50,
          0,
        )
        for (const p of perms) {
          p.set('is_active', false)
          $app.save(p)
        }
      } catch (_) {}

      // Registrar no log_auditoria o encerramento da permissão temporária
      try {
        const logCol = $app.findCollectionByNameOrId('log_auditoria')
        const logRec = new Record(logCol)
        logRec.set('colaborador_id', subId)
        logRec.set('colaborador_nome', cob.getString('colaborador_substituto_nome'))
        logRec.set('acao_tipo', 'acessou_com_permissao_extra')
        logRec.set('etapa_id', '4')
        logRec.set('etapa_propria', false)
        logRec.set('motivo', 'Acesso temporário encerrado automaticamente por expiração')
        logRec.set('autorizado_por', 'Sistema Cron')
        logRec.set('timestamp', new Date().toISOString().replace('T', ' ').slice(0, 19))
        $app.save(logRec)
      } catch (_) {}

      // Criar notificação para o gestor via WhatsApp/Sistema
      try {
        const notifCol = $app.findCollectionByNameOrId('notificacoes')
        const notif = new Record(notifCol)
        notif.set('destinatario_id', 'u1')
        notif.set('destinatario_nome', 'Carlos Silva (Gestor)')
        notif.set('telefone', '(11) 99999-8888')
        notif.set(
          'mensagem',
          'A permissão temporária de ' +
            cob.getString('colaborador_substituto_nome') +
            ' cobrindo ' +
            cob.getString('colaborador_ausente_nome') +
            ' expirou e o acesso foi removido automaticamente.',
        )
        notif.set('tipo', 'whatsapp_retorno_cobertura')
        notif.set('status', 'enviada')
        notif.set('enviada_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
        $app.save(notif)
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro no job de coberturas:', err)
  }
})
