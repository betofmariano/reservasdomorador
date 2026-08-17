export type HomeMenuButtonMetrics = {
  fontSize: number;
  iconSize: number;
  buttonHeight: number;
  iconContainerWidth: number;
  paddingHorizontal: number;
};

/** Métricas dos botões da Home — mantidas alinhadas com MatchPoint. */
export function getHomeMenuButtonMetrics(screenWidth: number): HomeMenuButtonMetrics {
  if (screenWidth < 340) {
    return {
      fontSize: 20,
      iconSize: 24,
      buttonHeight: 52,
      iconContainerWidth: 30,
      paddingHorizontal: 14,
    };
  }

  if (screenWidth < 400) {
    return {
      fontSize: 22,
      iconSize: 26,
      buttonHeight: 54,
      iconContainerWidth: 32,
      paddingHorizontal: 16,
    };
  }

  return {
    fontSize: 24,
    iconSize: 28,
    buttonHeight: 56,
    iconContainerWidth: 34,
    paddingHorizontal: 16,
  };
}
