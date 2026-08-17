export const ASSOCIACAO_LOCAL_LABELS = {
  singular: 'local de associação',
  plural: 'locais de associação',
  informe: 'Informe seu local de associação',
  selecione: 'Selecione um local de associação',
  selecioneTitulo: 'Selecione seu local de associação',
  carregando: 'Carregando locais de associação...',
  erroCarregar: 'Não foi possível carregar os locais de associação. Tente novamente.',
  obrigatorio: 'Selecione seu local de associação.',
  matriculaExigida:
    'Este local de associação exige título de sócio. Informe o número da matrícula para continuar.',
  complementoObrigatorio: 'Informe o complemento.',
  complementoObrigatorioTitulo: 'Complemento obrigatório',
  complementoObrigatorioMensagem:
    'Este local de associação exige complemento. Informe bloco, apartamento ou casa para continuar.',
  complementoOrientacao: 'Consulte o gestor para saber o que informar.',
  acessoBloqueado: 'Seu acesso está bloqueado. Entre em contato com o local de associação.',
  cadastroPendente:
    'Seu cadastro ainda não foi aprovado. Aguarde a confirmação do local de associação.',
  cadastroBloqueado: 'Este cadastro está bloqueado. Entre em contato com o local de associação.',
  telefoneDuplicado:
    'Existem vários cadastros com este telefone. Entre em contato com o gestor do seu local de associação para regularizar.',
  telefoneDuplicadoTitulo: 'Cadastros duplicados',
} as const;

export function formatAssociacaoLocalFallback(id: number): string {
  return `Local de associação #${id}`;
}
