#ifndef THERMOCOUPLE_READER_H
#define THERMOCOUPLE_READER_H

#include <Arduino.h>

// Leitor de termopares tipo K via SPI (MAX31855), compartilhando CLK/MISO.
// CS_T1 = Tubo U, CS_T2 = Forno 2. Em caso de erro mantém a última leitura válida.
class ThermocoupleReader {
 public:
  void begin();
  // Retorna true se AMBOS os termopares leram com sucesso neste ciclo.
  bool readTemps(float& t1, float& t2);

 private:
  float last_t1_ = 0.0f;
  float last_t2_ = 0.0f;
};

#endif  // THERMOCOUPLE_READER_H
