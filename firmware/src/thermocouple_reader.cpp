#include "thermocouple_reader.h"
#include "pin_map.h"

// Leitura bit-bang SPI do MAX6675 (16 bits, MSB primeiro).
// Frame: bit15 = sinal, bits 14..3 = temperatura (12 bits, LSB = 0,25 °C),
//        bit2 = termopar aberto, bit1 = SCV, bit0 = SCG.
static uint16_t read_max6675(int cs_pin) {
  uint16_t data = 0;
  digitalWrite(cs_pin, LOW);
  delayMicroseconds(1);
  for (int i = 0; i < 16; i++) {
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

// Converte a temperatura (12 bits em bits 14..3, LSB = 0,25 °C).
// Retorna NAN se houver erro (termopar aberto / curto) em bits 2..0.
static float raw_to_c(uint16_t raw) {
  if (raw & 0x7) return NAN;  // erro: termopar aberto (bit2), SCV (bit1), SCG (bit0)
  int16_t t = static_cast<int16_t>((raw >> 3) & 0x0FFF);
  if (t & 0x0800) t |= 0xF000;  // extensão de sinal de 12 para 16 bits
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
  last_read_ms_[0] = 0;
  last_read_ms_[1] = 0;
  last_[0] = 0.0f;
  last_[1] = 0.0f;
}

// Lê um canal do MAX6675 respeitando o tempo de conversão (t_CONV ≤ 220 ms).
// Retorna true se o canal está saudável (sem termopar aberto/curto). `out`
// recebe o valor mais recente válido; leituras 0x0000 (conversão em andamento)
// ou com falha mantêm o último valor válido.
bool ThermocoupleReader::readChannel(int ch, int cs_pin, float& out) {
  unsigned long now = millis();

  // Se ainda está dentro do tempo de conversão, não lê o módulo (evita dados
  // inválidos/espúrios) e reutiliza o último valor válido.
  if ((now - last_read_ms_[ch]) < CONV_MS) {
    out = last_[ch];
    return true;
  }

  uint16_t raw = read_max6675(cs_pin);
  last_read_ms_[ch] = now;

  float v = raw_to_c(raw);
  if (isnan(v)) {
    // Falha real do termopar (aberto/curto): reporta erro, mantém último valor.
    out = last_[ch];
    return false;
  }
  if (raw == 0x0000) {
    // 0x0000 = leitura durante conversão / módulo ainda não pronto.
    // Não é erro permanente: mantém o último valor válido.
    out = last_[ch];
    return true;
  }

  last_[ch] = v;
  out = v;
  return true;
}

bool ThermocoupleReader::readTemps(float& t1, float& t2) {
  bool ok1 = readChannel(0, PIN_CS_T1, t1);
  bool ok2 = readChannel(1, PIN_CS_T2, t2);
  return ok1 && ok2;
}
