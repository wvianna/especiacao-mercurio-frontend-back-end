#include "json_protocol.h"
#include <ArduinoJson.h>

static uint8_t sat8(int64_t v) {
  if (v < 0) return 0;
  if (v > 255) return 255;
  return static_cast<uint8_t>(v);
}

bool parseIncoming(const char* buf, Command& cmd) {
  cmd.valid = false;
  cmd.is_config = false;

  JsonDocument doc;
  if (deserializeJson(doc, buf)) return false;  // JSON inválido/truncado

  // Handshake de parametrização (ganhos PID) — aceito, sem efeito nos atuadores.
  if (doc["cmd"] == "config") {
    cmd.is_config = true;
    return true;
  }

  // Pacote de escrita do ciclo de controle.
  JsonVariant valves = doc["valves"];
  JsonVariant pwm = doc["pwm"];
  if (valves.isNull() || pwm.isNull()) return false;  // não é um pacote de escrita

  cmd.sv1  = sat8(valves["sv1"] | 0);
  cmd.sv2  = sat8(valves["sv2"] | 0);
  cmd.sv3  = sat8(valves["sv3"] | 0);
  cmd.sv4  = sat8(valves["sv4"] | 0);
  cmd.sv5  = sat8(valves["sv5"] | 0);
  cmd.pump = sat8(doc["pump"]  | 0);
  cmd.pwm_u  = sat8(pwm["u"]  | 0);
  cmd.pwm_f2 = sat8(pwm["f2"] | 0);
  cmd.valid = true;
  return true;
}

void buildReport(const Report& rep, char* out, size_t cap) {
  JsonDocument doc;
  doc["temp"]["t1"] = rep.t1;
  doc["temp"]["t2"] = rep.t2;
  doc["status"] = rep.status;
  doc["error_code"] = rep.error_code;
  serializeJson(doc, out, cap);
}
