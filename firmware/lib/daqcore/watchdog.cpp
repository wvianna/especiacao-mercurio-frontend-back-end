#include "watchdog.h"

#if defined(ARDUINO)
#include <Arduino.h>
static uint32_t default_now() { return static_cast<uint32_t>(millis()); }
#else
static uint32_t default_now() { return 0; }
#endif

Watchdog::Watchdog(uint32_t timeout_ms)
    : timeout_ms_(timeout_ms), last_feed_(0), now_(default_now) {}

void Watchdog::feed() { last_feed_ = now_(); }

bool Watchdog::tripped() const { return (now_() - last_feed_) > timeout_ms_; }

void Watchdog::setNow(NowFn fn) { now_ = fn; }

void Watchdog::setTimeoutMs(uint32_t ms) { timeout_ms_ = ms; }
