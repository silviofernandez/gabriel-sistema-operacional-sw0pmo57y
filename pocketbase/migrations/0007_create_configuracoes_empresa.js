migrate(
  (app) => {
    const collection = new Collection({
      name: 'configuracoes_empresa',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: '',
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome_fantasia', type: 'text', required: true },
        { name: 'razao_social', type: 'text' },
        { name: 'cnpj', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'cidade', type: 'text' },
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
        },
        { name: 'logo_url', type: 'text' },
        { name: 'cor_primaria', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)

    // Criar registro inicial padrão da Imobiliária Gabriel
    const record = new Record(collection)
    record.set('nome_fantasia', 'Imobiliária Gabriel')
    record.set('razao_social', 'Gabriel Negócios Imobiliários Ltda')
    record.set('cnpj', '45.123.890/0001-12')
    record.set('telefone', '(14) 3622-0000')
    record.set('email', 'atendimento@gabrielimoveis.com.br')
    record.set('cidade', 'Jaú / Pederneiras / Lençóis Paulista')
    record.set('cor_primaria', '#1e3a8a')
    app.save(record)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('configuracoes_empresa')
      app.delete(collection)
    } catch (_) {}
  },
)
