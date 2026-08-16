#include "actuator_driver.h"

void ActuatorDriver::apply(const Command& cmd) {
  digitalWrite(PIN_SV1, cmd.sv1 ? HIGH : LOW);
  digitalWrite(PIN_SV2, cmd.sv2 ? HIGH : LOW);
  digitalWrite(PIN_SV3, cmd.sv3 ? HIGH : LOW);
  digitalWrite(PIN_SV4, cmd.sv4 ? HIGH : LOW);
  digitalWrite(PIN_SV5, cmd.sv5 ? HIGH : LOW);
  digitalWrite(PIN_PUMP, cmd.pump ? HIGH : LOW);
  analogWrite(PIN_FORNO1, cmd.pwm_u);
  analogWrite(PIN_FORNO2, cmd.pwm_f2);
}

void ActuatorDriver::shutdown() { safeState(); }
