#ifndef PIN_MAP_H
#define PIN_MAP_H

#include <Arduino.h>

// Mapeamento de I/O conforme TDD (docs/TDD.md — Mapeamento de I/O)
#define PIN_PUMP   2   // Bomba peristáltica (TEBS)
#define PIN_SV3    3   // Válvula 3-vias: direcionamento Vapor/Tubo U
#define PIN_SV2    4   // Válvula 3-vias: agitação / Purga 1
#define PIN_SV4    5   // Válvula solenóide: Purga 2 (Náfion)
#define PIN_SV5    6   // Pistão criogênico (copo de N2)
#define PIN_SV1    7   // Válvula de Hélio (gás de arraste)
#define PIN_CLK    8   // SPI: clock (termopares T1/T2)
#define PIN_FORNO1 9   // PWM: Tubo U (rampa de temperatura)
#define PIN_FORNO2 10  // PWM: Atomizador (estático 700°C)
#define PIN_S0     11  // SPI: MISO (dados dos termopares)
#define PIN_CS_T1  12  // SPI: Chip Select termopar 1 (Tubo U)
#define PIN_CS_T2  13  // SPI: Chip Select termopar 2 (Forno 2)

#define PWM_MAX 255

// Safe State: válvulas/bomba desligadas, fornos a 0%, SV5 (pistão) em nível baixo.
inline void safeState() {
  digitalWrite(PIN_SV1, LOW);
  digitalWrite(PIN_SV2, LOW);
  digitalWrite(PIN_SV3, LOW);
  digitalWrite(PIN_SV4, LOW);
  digitalWrite(PIN_SV5, LOW);  // pistão em nível baixo por segurança
  digitalWrite(PIN_PUMP, LOW);
  analogWrite(PIN_FORNO1, 0);
  analogWrite(PIN_FORNO2, 0);
}

// Configura os pinos e entra em Safe State (todas as saídas em zero).
inline void initPins() {
  pinMode(PIN_SV1, OUTPUT);
  pinMode(PIN_SV2, OUTPUT);
  pinMode(PIN_SV3, OUTPUT);
  pinMode(PIN_SV4, OUTPUT);
  pinMode(PIN_SV5, OUTPUT);
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_FORNO1, OUTPUT);
  pinMode(PIN_FORNO2, OUTPUT);
  safeState();
}

#endif  // PIN_MAP_H
