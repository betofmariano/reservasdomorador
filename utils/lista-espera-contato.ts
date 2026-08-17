import type { User } from '@/types/user';
import { formatBrazilianMobilePhone } from '@/utils/phone-mask';

export function resolveTelefoneCadastroUsuario(user: Pick<User, 'telefone' | 'telefoneConfirmado' | 'telefoneLimpo' | 'telefoneCorrigido'>): string {
  const confirmado = user.telefoneConfirmado?.trim();

  if (confirmado) {
    return confirmado;
  }

  const limpo = user.telefoneLimpo?.trim();

  if (limpo) {
    return formatBrazilianMobilePhone(limpo) || limpo;
  }

  const corrigido = user.telefoneCorrigido?.trim();

  if (corrigido) {
    return corrigido;
  }

  return user.telefone?.trim() ?? '';
}

export function resolveNomeCadastroUsuario(user: Pick<User, 'nome'>): string {
  return user.nome.trim();
}
