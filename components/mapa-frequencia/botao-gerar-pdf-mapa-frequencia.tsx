import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { gerarMapaFrequenciaPdf } from '@/utils/gerar-mapa-frequencia-pdf';
import type { GerarMapaFrequenciaPdfInput } from '@/utils/gerar-mapa-frequencia-pdf';

type BotaoGerarPdfMapaFrequenciaProps = {
  input: GerarMapaFrequenciaPdfInput | null;
  disabled?: boolean;
};

const COLORS = {
  blue: '#2456A8',
  error: '#D64545',
};

export function BotaoGerarPdfMapaFrequencia({
  input,
  disabled = false,
}: BotaoGerarPdfMapaFrequenciaProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGeneratePdf() {
    if (!input || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      await gerarMapaFrequenciaPdf(input);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível gerar o PDF. Tente novamente.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const isDisabled = disabled || !input || isGenerating;

  return (
    <>
      <Pressable
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={() => void handleGeneratePdf()}
        disabled={isDisabled}>
        {isGenerating ? (
          <ActivityIndicator size="small" color={COLORS.blue} />
        ) : (
          <>
            <Ionicons name="document-text-outline" size={18} color={COLORS.blue} />
            <Text style={styles.buttonText}>PDF</Text>
          </>
        )}
      </Pressable>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
  },
});
