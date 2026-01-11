# NBR 6118 API

API REST para cálculos de engenharia estrutural conforme **NBR 6118:2023** (Projeto de Estruturas de Concreto).

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Endpoints](https://img.shields.io/badge/Endpoints-12-green)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Funcionalidades

- **12 Endpoints** para cálculos estruturais completos
- **Dashboard Interativo** com formulários para todos os módulos
- **NBR 6118:2023** - Fórmulas e tabelas atualizadas
- **Validação Zod** - Schemas robustos para todos os inputs

## 🚀 Quick Start

```bash
cd nbr6118-api
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 📡 Endpoints da API (12 total)

### Básicos

| Endpoint                            | Descrição                 |
| ----------------------------------- | ------------------------- |
| `POST /api/v1/section/properties`   | Propriedades geométricas  |
| `POST /api/v1/materials/properties` | Propriedades de materiais |
| `POST /api/v1/loads/calculate`      | Combinações de cargas     |

### Vigas - ELU

| Endpoint                                | Descrição                |
| --------------------------------------- | ------------------------ |
| `POST /api/v1/beam/design/longitudinal` | Armadura de flexão       |
| `POST /api/v1/beam/design/shear`        | Armadura de cisalhamento |
| `POST /api/v1/beam/design/torsion`      | Armadura de torção       |

### Vigas - ELS

| Endpoint                              | Descrição                 |
| ------------------------------------- | ------------------------- |
| `POST /api/v1/beam/verify/deflection` | Verificação de flechas    |
| `POST /api/v1/beam/verify/cracking`   | Verificação de fissuração |

### Pilares

| Endpoint                     | Descrição                     |
| ---------------------------- | ----------------------------- |
| `POST /api/v1/column/design` | Dimensionamento (λ, 2ª ordem) |

### Lajes

| Endpoint                            | Descrição                      |
| ----------------------------------- | ------------------------------ |
| `POST /api/v1/slab/design`          | Dimensionamento (Bares/Marcus) |
| `POST /api/v1/slab/verify/punching` | Verificação de punção          |

### Detalhamento

| Endpoint                           | Descrição           |
| ---------------------------------- | ------------------- |
| `POST /api/v1/detailing/anchorage` | Ancoragem e emendas |

---

## 📖 Exemplos de Requisições

### Dimensionamento de Torção

```http
POST /api/v1/beam/design/torsion

{
  "section": { "type": "rectangular", "width": 20, "height": 50 },
  "materials": { "concrete": "C25", "steel": "CA-50" },
  "loading": { 
    "tsd": { "value": 15, "unit": "kN.m" },
    "vsd": { "value": 80, "unit": "kN" },
    "vrd2": 250
  }
}
```

**Fórmulas:**
- `TRd2 = 0.5 × αv2 × fcd × Ae × he`
- `Asl = Tsd / (2 × Ae × fyd)`
- Interação: `(Tsd/TRd2) + (Vsd/VRd2) ≤ 1`

### Verificação de Punção

```http
POST /api/v1/slab/verify/punching

{
  "slab": { "h": 20 },
  "pillar": { "a": 30, "b": 30, "type": "internal" },
  "materials": { "concrete": "C30" },
  "loading": { "fsd": 500 },
  "reinforcement": { "rho_x": 0.005, "rho_y": 0.005 }
}
```

**Fórmulas:**
- `τsd = Fsd / (u × d)`
- `τRd1 = 0.13 × (1 + √(20/d)) × ∛(100 × ρ × fck)`
- Perímetros: interno `2(a+b) + 4πd`, borda `a + 2b + πd`

### Dimensionamento de Lajes

```http
POST /api/v1/slab/design

{
  "geometry": { "Lx": 400, "Ly": 500, "h": 12 },
  "materials": { "concrete": "C25" },
  "loading": { "dead": 5, "live": 2 }
}
```

**Fórmulas (Bares/Marcus):**
- `Mx = μx × p × Lx²`
- `My = μy × p × Lx²`
- Classificação: λ ≤ 2 (duas direções), λ > 2 (uma direção)

### Dimensionamento de Pilares

```http
POST /api/v1/column/design

{
  "geometry": { "bx": 20, "by": 40 },
  "length": 300,
  "materials": { "concrete": "C30", "steel": "CA-50" },
  "loading": { "nd": 1200, "mx_top": 500, "mx_bot": 300 }
}
```

---

## 🏗️ Arquitetura

```
src/
├── app/
│   ├── page.tsx          # Dashboard frontend
│   └── api/v1/           # 12 API routes
├── core/
│   ├── design/           # Flexão, Cisalhamento, Torção, Pilares, Lajes
│   ├── verification/     # Flechas, Fissuração, Punção
│   └── detailing/        # Ancoragem
├── data/                 # Tabelas NBR (Bares, materiais)
├── lib/schemas/          # Validação Zod
└── services/             # Orquestração
```

## 🧪 Tecnologias

- **Next.js 15** - App Router
- **TypeScript** - Tipagem estática
- **Zod** - Validação de schemas
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones

## 📄 Licença

MIT License

## 🔗 Referências

- [NBR 6118:2023](https://www.abntcatalogo.com.br/) - Projeto de Estruturas de Concreto
- [NBR 7480](https://www.abntcatalogo.com.br/) - Aço para Armadura
