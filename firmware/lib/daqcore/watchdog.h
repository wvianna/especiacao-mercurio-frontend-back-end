#ifndef DAQCORE_WATCHDOG_H
#define DAQCORE_WATCHDOG_H

#include <stdint.h>

// Watchdog de segurança: se não houver pacote válido dentro de `timeout_ms`,
// `tripped()` retorna true e o chamador deve forçar o Safe State (desligar fornos).
class Watchdog {
 public:
  typedef uint32_t (*NowFn)(void);

  explicit Watchdog(uint32_t timeout_ms = 1000);

  void feed();                 // registra recebimento de pacote válido
  bool tripped() const;        // true se passou do timeout sem feed
  void setNow(NowFn fn);       // injeta fonte de tempo (testes)
  void setTimeoutMs(uint32_t ms);

 private:
  uint32_t timeout_ms_;
  uint32_t last_feed_;
  NowFn now_;
};

#endif  // DAQCORE_WATCHDOG_H
