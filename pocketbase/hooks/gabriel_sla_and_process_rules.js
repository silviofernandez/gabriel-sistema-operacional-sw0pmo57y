// Cron job para SLA de Atendimento, Prazos de Casos e Escalonamento ao Gestor
// Executa a cada hora para atualizar prazos e escalar atrasos
cronAdd('gabriel_sla_and_deadline_check', '0 * * * *', () => {
  const now = new Date()
  const nowIso = now.toISOString()

  try {
    // 1. Localizar casos em andamento com prazo de primeira resposta estourado sem resposta humana
    const casosSemResposta = $app.findRecordsByFilter(
      'casos_processos',
      "data_primeira_resposta_humana = '' && prazo_primeira_resposta != '' && prazo_primeira_resposta < '" +
        nowIso +
        "' && status != 'Resolvido' && status != 'Cancelado'",
      '-created',
      50,
      0,
    )

    for (const c of casosSemResposta) {
      // Registrar alerta e notificar gestor se não escalado
      const proto = c.getString('protocolo')
      const titulo = c.getString('titulo')
      const respNome = c.getString('responsavel_nome') || 'Não atribuído'

      try {
        const notifCol = $app.findCollectionByNameOrId('notificacoes')
        const notif = new Record(notifCol)
        notif.set('destinatario_id', 'u1')
        notif.set('destinatario_nome', 'Carlos Silva (Gestor Geral)')
        notif.set('telefone', '(14) 99888-1122')
        notif.set(
          'mensagem',
          '[ESCALONAMENTO SLA] O caso ' +
            proto +
            ' ("' +
            titulo +
            '") ultrapassou o prazo de primeira resposta humana sem retorno ao cliente. Responsável: ' +
            respNome +
            '.',
        )
        notif.set('tipo', 'whatsapp_sla_alerta')
        notif.set('status', 'enviada')
        notif.set('enviada_em', nowIso.replace('T', ' ').slice(0, 19))
        $app.save(notif)
      } catch (_) {}
    }

    // 2. Localizar atividades atrasadas (prazo menor que agora e não concluídas)
    const ativsAtrasadas = $app.findRecordsByFilter(
      'atividades_casos',
      "prazo != '' && prazo < '" +
        nowIso +
        "' && status != 'Concluída' && status != 'Atrasada' && status != 'Recusada'",
      '-created',
      50,
      0,
    )

    for (const a of ativsAtrasadas) {
      a.set('status', 'Atrasada')
      $app.save(a)
    }
  } catch (err) {
    console.log('Erro no job gabriel_sla_and_deadline_check:', err)
  }
})

// Hook onRecordBeforeCreateRequest / onRecordBeforeUpdateRequest para validação de bloqueios
onRecordCreateRequest((e) => {
  if (e.collection.name === 'casos_processos') {
    // Garantir que caso novo tenha protocolo gerado se vazio
    if (!e.record.getString('protocolo')) {
      const ano = new Date().getFullYear()
      const rand = Math.floor(1000 + Math.random() * 9000)
      e.record.set('protocolo', 'GAB-' + ano + '-' + rand)
    }
  }
}, 'casos_processos')
