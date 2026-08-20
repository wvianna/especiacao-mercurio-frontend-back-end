#include "actuator_driver.h"

void ActuatorDriver::apply(const Command& cmd) {
  // Válvulas e fornos: acionamento direto pelo estado lógico do comando.
  digitalWrite(PIN_SV1, cmd.sv1 ? HIGH : LOW);
  digitalWrite(PIN_SV2, cmd.sv2 ? HIGH : LOW);
  digitalWrite(PIN_SV3, cmd.sv3 ? HIGH : LOW);
  digitalWrite(PIN_SV4, cmd.sv4 ? HIGH : LOW);
  digitalWrite(PIN_SV5, cmd.sv5 ? HIGH : LOW);
  analogWrite(PIN_FORNO1, cmd.pwm_u);
  analogWrite(PIN_FORNO2, cmd.pwm_f2);

  // Bomba peristáltica: trava por pulso (toggle). Na transição do estado
  // lógico desejado (0->1 ou 1->0), emite um pulso nível alto -> baixo de
  // PUMP_PULSE_MS. O pino fica HIGH apenas durante o pulso; a bomba alterna
  // o estado físico a cada pulso e o mantém por conta própria (latching).
  if (pump_.update(cmd.pump != 0)) {
    digitalWrite(PIN_PUMP, HIGH);  // inicia o pulso de toggle
  }
}

void ActuatorDriver::update() {
  // Avança o temporizador do pulso e mantém o pino coerente com ele
  // (HIGH durante o pulso; LOW no fim — o toggle é concluído).
  pump_.update(pump_.desired());
  digitalWrite(PIN_PUMP, pump_.pulsing() ? HIGH : LOW);
}

void ActuatorDriver::shutdown() {
  safeState();
  // Aborta qualquer pulso em andamento e reinicia o rastreio do estado
  // lógico: o próximo comando de bomba acionará um novo pulso de toggle.
  pump_.reset();
}
