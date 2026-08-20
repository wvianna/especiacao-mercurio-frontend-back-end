#ifndef DAQCORE_PUMP_TOGGLE_H
#define DAQCORE_PUMP_TOGGLE_H

#include <stdint.h>

// Acionamento por pulso (toggle) da bomba peristáltica.
//
// A bomba alterna o estado físico (ligada/desligada) a cada pulso
// (nível alto -> baixo) e o mantém por conta própria (dispositivo de
// trava). O mestre envia apenas o estado LÓGICO desejado (0/1); esta
// classe detecta a transição desse estado e sinaliza quando emitir o
// pulso e por quanto tempo manter o nível alto.
class PumpToggle {
 public:
  typedef uint32_t (*NowFn)(void);

  explicit PumpToggle(uint32_t pulse_ms = 600);

  // Atualiza com o estado lógico desejado. Retorna true no instante em que
  // um novo pulso deve COMEÇAR (transição 0<->1). Chamadas subsequentes com
  // o mesmo estado apenas avançam o temporizador do pulso.
  bool update(bool desired);

  // True enquanto o pulso está em andamento (pino deve ficar nível alto).
  bool pulsing() const;

  // Estado lógico desejado atual (para avançar o pulso no loop rápido).
  bool desired() const;

  // Aborta o pulso e reinicia o rastreio (Safe State).
  void reset();

  void setNow(NowFn fn);  // injeta fonte de tempo (testes)

 private:
  uint32_t pulse_ms_;
  bool desired_;
  bool pulsing_;
  uint32_t start_;
  NowFn now_;
};

#endif  // DAQCORE_PUMP_TOGGLE_H
