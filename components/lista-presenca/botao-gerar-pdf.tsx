import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { gerarListaPresencaPdf } from '@/utils/gerar-lista-presenca-pdf';
import type { GerarListaPresencaPdfInput } from '@/utils/gerar-lista-presenca-pdf';

type BotaoGerarPdfProps = {
  input: GerarListaPresencaPdfInput | null;
  disabled?: boolean;
  inline?: boolean;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  white: '#FFFFFF',
  error: '#D64545',
};

export function BotaoGerarPdf({ input, disabled = false, inline = false }: BotaoGerarPdfProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGeneratePdf() {
    if (!input || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      await gerarListaPresencaPdf(input);
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
    <View style={inline ? styles.inlineWrapper : undefined}>
      <Pressable
        style={[
          styles.button,
          inline && styles.buttonInline,
          isDisabled && styles.buttonDisabled,
        ]}
        onPress={() => void handleGeneratePdf()}
        disabled={isDisabled}>
        {isGenerating ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="document-text-outline" size={20} color={COLORS.white} />
            <Text style={styles.buttonText}>PDF</Text>
          </>
        )}
      </Pressable>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrapper: {
    flexShrink: 0,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: COLORS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  buttonInline: {
    minHeight: 40,
    paddingHorizontal: 16,
    alignSelf: 'auto',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
  },
});
