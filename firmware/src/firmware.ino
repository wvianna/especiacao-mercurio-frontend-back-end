// Firmware DAQ — Especiação de Mercúrio
// Arduino Uno: aplica atuadores via JSON, lê termopares SPI e responde a 4 Hz.
// Watchdog: desliga fornos se não receber pacote válido por > 1 s.

#include "pin_map.h"
#include "actuator_driver.h"
#include "thermocouple_reader.h"
#include <json_protocol.h>
#include <watchdog.h>

ThermocoupleReader thermo;
ActuatorDriver actuator;
Watchdog watchdog(1000);

static char line_buf[256];
static int line_len = 0;
static unsigned long last_cycle = 0;

void setup() {
  Serial.begin(115200);
  initPins();   // já aplica Safe State
  thermo.begin();
}

void loop() {
  // --- Leitura da serial (line-delimited JSON) ---
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n') {
      line_buf[line_len] = '\0';
      Command cmd = {0, 0, 0, 0, 0, 0, 0, 0, false, false};
      if (parseIncoming(line_buf, cmd)) {
        watchdog.feed();
        if (cmd.valid) actuator.apply(cmd);
      }
      line_len = 0;
    } else if (line_len < (int)sizeof(line_buf) - 1) {
      line_buf[line_len++] = c;
    } else {
      line_len = 0;  // descarta linha excessivamente longa
    }
  }

  // --- Watchdog: força Safe State se passar de 1 s sem pacote válido ---
  if (watchdog.tripped()) {
    actuator.shutdown();
  }

  // --- Ciclo de aquisição a 250 ms (4 Hz) ---
  unsigned long now = millis();
  if (now - last_cycle >= 250) {
    last_cycle = now;
    float t1 = 0.0f, t2 = 0.0f;
    bool ok = thermo.readTemps(t1, t2);
    Report rep = {
        t1,
        t2,
        watchdog.tripped() ? "safe" : "active",
        ok ? 0 : 1,
    };
    char out[128];
    buildReport(rep, out, sizeof(out));
    Serial.println(out);
  }
}
