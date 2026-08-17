#ifndef THERMOCOUPLE_READER_H
#define THERMOCOUPLE_READER_H

#include <Arduino.h>

// Leitor de termopares tipo K via SPI (MAX6675), compartilhando CLK/MISO.
// CS_T1 = Tubo U, CS_T2 = Forno 2. Em caso de erro mantém a última leitura válida.
//
// O MAX6675 leva até 220 ms (t_CONV) para concluir cada conversão; uma leitura
// feita antes disso pode devolver 0x0000 (0 °C) de forma espúria. Este leitor
// respeita o tempo de conversão e descarta leituras 0x0000, mantendo o último
// valor válido (sem "piscar" para 0).
class ThermocoupleReader {
 public:
  void begin();
  // Retorna true se AMBOS os termopares estão saudáveis neste ciclo
  // (sem termopar aberto/curto). t1/t2 recebem o valor mais recente válido.
  bool readTemps(float& t1, float& t2);

 private:
  static const unsigned long CONV_MS = 220;  // t_CONV máx. do MAX6675
  unsigned long last_read_ms_[2] = {0, 0};   // instante da última leitura por canal
  float last_[2] = {0.0f, 0.0f};             // último valor válido por canal
  bool readChannel(int ch, int cs_pin, float& out);
};

#endif  // THERMOCOUPLE_READER_H
