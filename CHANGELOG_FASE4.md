# Changelog — Fase 4: Auditoria Profunda NBR 6118:2023

> Data: 2026-03-08  
> Branch: `fix/normative-audit-fase4`  
> Auditor: Antigravity AI + Revisão Normativa

## 🟠 Correções de Alta Prioridade

### F4-01: PunchingShear — Fator k limitado a 2.0
- **Arquivo:** `src/core/verification/PunchingShear.ts`
- **Norma:** NBR 6118:2023, Item 19.5.3.1
- **Problema:** O fator `k = 1 + √(20/d)` na fórmula de τRd1 não estava limitado ao valor máximo de 2.0. Para lajes com d < 5cm, k atingia valores até 3.24, superestimando a resistência em ~60%.
- **Correção:** `k = min(1 + √(20/d), 2.0)`
- **Impacto:** Segurança — evita verificação não-conservadora em lajes finas.

### F4-02: LoadService — Fator ψ para cargas secundárias por combinação
- **Arquivo:** `src/services/load.service.ts`
- **Norma:** NBR 6118:2023, Item 11.8
- **Problema:** A carga variável secundária (`q_secondary`) era pré-multiplicada por ψ₀ e reutilizada para todos os tipos de combinação ELS. A combinação rara deveria usar o valor integral.
- **Correção:** 
  - ELU: `q_secondary × ψ₀` ✅
  - ELS Rara: `q_secondary × 1.0` (valor integral)
  - ELS Frequente/Quase-permanente: `q_secondary × ψ₂`
- **Impacto:** Precisão — combinações de serviço agora conformes com a norma.

### F4-03: CrackingVerification — Largura da seção parametrizável
- **Arquivo:** `src/core/verification/CrackingVerification.ts`
- **Norma:** NBR 6118:2023, Item 17.3.3.2
- **Problema:** `b_section = 100` hardcoded fazia o cálculo de Acri e ρri incorreto para vigas (b ≠ 100cm).
- **Correção:** Adicionado parâmetro opcional `b` na interface `CrackingParams` (default 100cm para lajes por metro de largura).
- **Impacto:** Funcionalidade — vigas agora podem calcular fissuração com largura real.

## 🟡 Correções de Média Prioridade

### F4-04: ColumnDesign — Solver ω generalizado para qualquer aço
- **Arquivo:** `src/core/design/ColumnDesign.ts`
- **Problema:** A função `calculateOmega` tinha εyd hardcoded para CA-50 (fyk=500, Es=210GPa).
- **Correção:** Adicionados parâmetros `fyk` e `Es_GPa`, propagados pela chamada em `calculateColumnDesign`.
- **Impacto:** Flexibilidade — suporta CA-25, CA-60 e aços especiais.

### F4-05: ColumnDesign — Classificação "verySlender"
- **Arquivo:** `src/core/design/ColumnDesign.ts`
- **Norma:** NBR 6118:2023, Item 15.8.1
- **Problema:** Pilares com 140 < λ ≤ 200 reutilizavam classificação "slender".
- **Correção:** Adicionado tipo `"verySlender"` ao union type `SlendernessResult.classification`.
- **Impacto:** Semântica — classificação mais precisa para pilares muito esbeltos.

### F4-06: concrete.data — Docstring αe para fck > 50 MPa
- **Arquivo:** `src/data/materials/concrete.data.ts`
- **Problema:** Docstring dizia `Eci = 21500×...` sem αe para fck>50, mas código aplicava αe corretamente.
- **Correção:** Docstring atualizada para `Eci = αe × 21500×...`.

## 🟢 Correções de Baixa Prioridade

### F4-07: Tipo de edifício "HOSPITAL" adicionado
- **Arquivo:** `src/data/loads/coefficients.data.ts`
- **Norma:** NBR 6118:2023, Tabela 11.2
- **Correção:** Adicionado `HOSPITAL: { ψ₀=0.6, ψ₁=0.4, ψ₂=0.2 }`.

### F4-08: TorsionDesign — Comentário em _d não utilizado
- **Arquivo:** `src/core/design/TorsionDesign.ts`
- **Correção:** Adicionado comentário explicativo ao `_d` não utilizado.

### F4-09: SlabDesign — Variável _p_kN_cm2 removida
- **Arquivo:** `src/core/design/SlabDesign.ts`
- **Correção:** Removida variável não utilizada `_p_kN_cm2`.

## ✅ Testes Adicionados

| Teste  | Verificação                        |
| ------ | ---------------------------------- |
| F4-01a | k capped at 2.0 for d < 5cm        |
| F4-01b | k unchanged for normal d=20cm      |
| F4-02  | ELS rare uses full q_secondary     |
| F4-05  | λ=160 → verySlender classification |

**Total de testes:** 62 → **66** (100% passando)
