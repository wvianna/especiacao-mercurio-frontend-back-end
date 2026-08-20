#include "pump_toggle.h"

#if defined(ARDUINO)
#include <Arduino.h>
static uint32_t default_now() { return static_cast<uint32_t>(millis()); }
#else
static uint32_t default_now() { return 0; }
#endif

PumpToggle::PumpToggle(uint32_t pulse_ms)
    : pulse_ms_(pulse_ms),
      desired_(false),
      pulsing_(false),
      start_(0),
      now_(default_now) {}

bool PumpToggle::update(bool desired) {
  if (desired != desired_) {
    // Transição do estado lógico: (re)inicia o pulso de toggle.
    desired_ = desired;
    pulsing_ = true;
    start_ = now_();
    return true;
  }
  // Sem transição: apenas avança o temporizador do pulso em andamento.
  if (pulsing_ && (now_() - start_ >= pulse_ms_)) {
    pulsing_ = false;
  }
  return false;
}

bool PumpToggle::pulsing() const { return pulsing_; }

bool PumpToggle::desired() const { return desired_; }

void PumpToggle::reset() {
  pulsing_ = false;
  desired_ = false;
}

void PumpToggle::setNow(NowFn fn) { now_ = fn; }
