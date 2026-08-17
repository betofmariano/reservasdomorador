import { compareVersions, runCompareVersionTests } from '../utils/compare-versions';

runCompareVersionTests();

const scenarioTests = [
  {
    name: 'Cenário 5: 1.10.0 > 1.9.9',
    pass: compareVersions('1.10.0', '1.9.9') === 1,
  },
  {
    name: 'Cenário 1: mesma versão',
    pass: compareVersions('1.0.2', '1.0.2') === 0,
  },
  {
    name: 'Atualização disponível',
    pass: compareVersions('1.0.2', '1.0.3') === -1,
  },
  {
    name: 'Versão local ausente tratada como antiga',
    pass: compareVersions('0.0.0', '1.0.2') === -1,
  },
];

for (const scenario of scenarioTests) {
  if (!scenario.pass) {
    throw new Error(`Failed: ${scenario.name}`);
  }
}

console.log(`Version check tests passed: ${scenarioTests.length + 7}`);
