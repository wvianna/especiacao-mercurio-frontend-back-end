#include "thermocouple_reader.h"
#include "pin_map.h"

// Leitura bit-bang SPI do MAX31855 (32 bits, MSB primeiro).
static int32_t read_max31855(int cs_pin) {
  int32_t data = 0;
  digitalWrite(cs_pin, LOW);
  delayMicroseconds(1);
  for (int i = 0; i < 32; i++) {
    digitalWrite(PIN_CLK, LOW);
    delayMicroseconds(1);
    digitalWrite(PIN_CLK, HIGH);
    delayMicroseconds(1);
    data <<= 1;
    if (digitalRead(PIN_S0)) data |= 1;
  }
  digitalWrite(cs_pin, HIGH);
  return data;
}

// Converte temperatura de 14 bits (bits 31..18); NaN se houver erro (bits 2..0).
static float raw_to_c(int32_t raw) {
  if (raw & 0x7) return NAN;  // erro: OC, SCG, SCV ou faltam dados
  int16_t t = static_cast<int16_t>((raw >> 18) & 0x3FFF);
  if (t & 0x2000) t |= 0xC000;  // extensão de sinal de 14 para 16 bits
  return static_cast<float>(t) * 0.25f;  // LSB = 0,25 °C
}

void ThermocoupleReader::begin() {
  pinMode(PIN_CLK, OUTPUT);
  pinMode(PIN_S0, INPUT);
  pinMode(PIN_CS_T1, OUTPUT);
  pinMode(PIN_CS_T2, OUTPUT);
  digitalWrite(PIN_CLK, LOW);
  digitalWrite(PIN_CS_T1, HIGH);
  digitalWrite(PIN_CS_T2, HIGH);
}

bool ThermocoupleReader::readTemps(float& t1, float& t2) {
  float v1 = raw_to_c(read_max31855(PIN_CS_T1));
  float v2 = raw_to_c(read_max31855(PIN_CS_T2));
  bool ok1 = !isnan(v1);
  bool ok2 = !isnan(v2);
  if (ok1) last_t1_ = v1;
  if (ok2) last_t2_ = v2;
  t1 = last_t1_;
  t2 = last_t2_;
  return ok1 && ok2;
}
