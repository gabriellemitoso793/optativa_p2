# 🚀 AETHER VANGUARD

> **Um shooter espacial 3D "Endless Runner" desenvolvido com WebGL e Three.js.**

![Badge Three.js](https://img.shields.io/badge/Engine-Three.js-black?style=for-the-badge&logo=three.js)
![Badge JS](https://img.shields.io/badge/Language-JavaScript_ES6-yellow?style=for-the-badge&logo=javascript)
![Badge Status](https://img.shields.io/badge/Status-Alpha_v1.0-blue?style=for-the-badge)

---

## 📋 Sobre o Projeto

**Aether Vanguard** é um jogo de nave em terceira pessoa desenvolvido como projeto acadêmico para demonstrar competências em Computação Gráfica e Engenharia de Software.

O objetivo foi criar uma experiência imersiva no navegador sem o uso de engines pesadas (como Unity ou Unreal), utilizando apenas **JavaScript puro** e a biblioteca **Three.js**. O projeto foca em performance, arquitetura de código limpa (OOP) e efeitos visuais modernos (Post-Processing).

---

## ✨ Funcionalidades Técnicas (Destaques)

Este projeto implementa conceitos avançados de desenvolvimento de jogos:

* **Renderização 3D Real:** Uso de Câmera de Perspectiva, Geometrias Complexas e Iluminação Dinâmica.
* **Arquitetura Orientada a Objetos (OOP):** O código é modular, separado em Classes (`Player`, `Enemy`, `Particle`, `Game`) para escalabilidade e manutenção.
* **Pós-Processamento (Bloom):** Implementação de *EffectComposer* e *UnrealBloomPass* para criar o efeito de brilho neon "Glow" nas áreas emissivas.
* **Física e Colisão:** Cálculos vetoriais para detecção de colisão (Bounding Sphere/Distance Check).
* **Game Loop Otimizado:** Uso de `DeltaTime` para garantir que a física rode na mesma velocidade independente da taxa de quadros (FPS) do computador.
* **Sistema de Partículas:** Gerenciamento de array de partículas para efeitos de explosão com ciclo de vida (nascimento/morte) para gerenciamento de memória.

---

## 🎮 Controles

| Tecla | Ação |
| :--- | :--- |
| **W / S** | Mover Verticalmente (Cima/Baixo) |
| **A / D** | Mover Lateralmente (Inclinação da nave) |
| **ESPAÇO** | Disparar Canhão de Plasma |
| **SHIFT** | Ativar Turbo (Aumenta FOV e Velocidade) |

---

## 🛠️ Instalação e Execução

Como este projeto utiliza **Módulos ES6** (`import/export`) para organização do código, ele precisa ser servido via protocolo HTTP e não pode ser aberto diretamente pelo sistema de arquivos (`file://`).

### Opção 1: VS Code (Recomendado)
1. Instale a extensão **Live Server** no Visual Studio Code.
2. Abra a pasta do projeto.
3. Clique em **"Go Live"** no canto inferior direito.

### Opção 2: Python (Terminal)
Se você tiver Python instalado:
```bash
# Navegue até a pasta do projeto
cd aether-vanguard

# Inicie um servidor simples
python -m http.server